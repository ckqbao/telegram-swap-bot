import { ethers, TransactionReceipt } from 'ethers';
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from '@okx-dex/okx-dex-sdk';
import { SwapExecutor } from '../interfaces/swap-executor.interface';
import { Logger } from '@nestjs/common';

// Fixed gas price in wei per chain id; chains not listed use the default
const DEFAULT_FIXED_GAS_PRICE = BigInt(150000000); // 0.15 Gwei
const FIXED_GAS_PRICE_BY_CHAIN: Record<string, bigint> = {
  '4663': BigInt(120000000), // Robinhood Chain: 0.12 Gwei
};

export class EvmSwapExecutor implements SwapExecutor {
  private readonly logger = new Logger(EvmSwapExecutor.name);
  private readonly provider: ethers.Provider;
  private readonly DEFAULT_GAS_MULTIPLIER = BigInt(150); // 1.5x

  constructor(
    private readonly config: OKXConfig,
    private readonly networkConfig: ChainConfig,
  ) {
    if (!this.config.evm?.wallet) {
      throw new Error('EVM configuration required');
    }
    this.provider = this.config.evm.wallet.provider;
  }

  async executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult> {
    const quoteData = swapData.data?.[0];
    if (!quoteData?.routerResult) {
      throw new Error('Invalid swap data: missing router result');
    }

    const { routerResult } = quoteData;
    const tx = quoteData.tx;
    if (!tx) {
      throw new Error('Missing transaction data');
    }

    try {
      const result = await this.executeEvmTransaction(tx);
      return this.formatSwapResult(result, routerResult);
    } catch (error) {
      console.error('Swap execution failed:', error);
      throw error;
    }
  }

  private async executeEvmTransaction(tx: any) {
    if (!this.config.evm?.wallet) {
      throw new Error('EVM wallet required');
    }

    let retryCount = 0;
    let sentHash: string | undefined;
    while (retryCount < (this.networkConfig.maxRetries || 3)) {
      try {
        this.logger.log('Preparing transaction...');
        const gasMultiplier = BigInt(500); // 5x standard multiplier

        // Get current nonce, including transactions still pending in the mempool
        const nonce = await this.provider.getTransactionCount(this.config.evm.wallet.address, 'pending');

        // Get current gas prices
        // const feeData = await this.provider.getFeeData();
        // const baseFee = feeData.maxFeePerGas || BigInt(0);
        // const priorityFee = feeData.maxPriorityFeePerGas || BigInt(3000000000); // 3 gwei minimum

        const fixedGasPrice = FIXED_GAS_PRICE_BY_CHAIN[this.networkConfig.id] ?? DEFAULT_FIXED_GAS_PRICE;

        const transaction = {
          data: tx.data,
          to: tx.to,
          value: tx.value || '0',
          nonce,
          gasLimit: (BigInt(tx.gas || 0) * gasMultiplier) / BigInt(100),
          gasPrice: fixedGasPrice,
          // maxFeePerGas: (baseFee * gasMultiplier) / BigInt(100),
          // maxPriorityFeePerGas: (priorityFee * gasMultiplier) / BigInt(100),
        };

        this.logger.log(
          `Transaction details: ${JSON.stringify({
            to: transaction.to,
            value: transaction.value,
            nonce: transaction.nonce,
            gasLimit: transaction.gasLimit.toString(),
            gasPrice: transaction.gasPrice.toString(),
            // maxFeePerGas: transaction.maxFeePerGas.toString(),
            // maxPriorityFeePerGas: transaction.maxPriorityFeePerGas.toString(),
          })}`,
        );

        this.logger.log('Sending transaction...');
        const response = await this.config.evm.wallet.sendTransaction(transaction);
        sentHash = response.hash;
        this.logger.log(`Transaction sent! Hash: ${response.hash}`);

        // Wait a bit before checking status to allow transaction to be mined
        // await new Promise((resolve) => setTimeout(resolve, 5000));

        this.logger.log('Waiting for transaction confirmation...');
        try {
          // Poll for transaction status
          let receipt: TransactionReceipt | null = null;
          let attempts = 0;
          let notFoundStreak = 0;
          const maxAttempts = 30; // 30 attempts * 0.5 seconds = 15 seconds total
          const maxNotFoundStreak = 6; // tolerate ~3 seconds of RPC indexing lag

          while (attempts < maxAttempts) {
            receipt = await this.provider.getTransactionReceipt(response.hash);

            if (receipt) {
              this.logger.verbose(`Transaction confirmed! Block number: ${receipt.blockNumber}`);
              return receipt;
            }

            // Check if transaction is still pending. A just-sent transaction may
            // not be indexed by the RPC node yet, so only declare it dropped
            // after several consecutive misses.
            const tx = await this.provider.getTransaction(response.hash);
            if (!tx) {
              notFoundStreak++;
              if (notFoundStreak >= maxNotFoundStreak) {
                // Check if we're on a different network than expected
                const network = await this.provider.getNetwork();
                this.logger.error(`Transaction dropped. Network: ${network.name} (${network.chainId})`);
                throw new Error('Transaction dropped - check network and gas prices');
              }
            } else {
              notFoundStreak = 0;
            }

            this.logger.log(`Transaction still pending... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 0.5 seconds between checks
            attempts++;
          }

          throw new Error('Transaction confirmation timed out - check explorer for status');
        } catch (waitError: any) {
          console.error('Error waiting for confirmation:', waitError.message);
          throw waitError;
        }
      } catch (error: any) {
        retryCount++;
        console.error(`Transaction attempt ${retryCount} failed:`, error.message);

        if (error.code === 'INSUFFICIENT_FUNDS') {
          throw new Error('Insufficient funds for transaction');
        }
        if (error.code === 'NONCE_EXPIRED') {
          throw new Error('Transaction nonce expired');
        }

        if (retryCount === this.networkConfig.maxRetries) {
          console.error('Max retries reached. Last error:', error);
          throw error;
        }

        const delay = 2000 * retryCount;
        this.logger.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // The transaction may have been mined despite the error (e.g. it was
        // wrongly declared dropped due to RPC lag). Re-sending the swap in
        // that case would execute it twice, so check before retrying.
        if (sentHash) {
          const minedReceipt = await this.provider.getTransactionReceipt(sentHash).catch(() => null);
          if (minedReceipt) {
            this.logger.log(`Transaction ${sentHash} was mined after all, skipping retry`);
            return minedReceipt;
          }
        }
      }
    }

    throw new Error('Max retries exceeded');
  }

  private formatSwapResult(txReceipt: TransactionReceipt, routerResult: any): SwapResult {
    const fromDecimals = parseInt(routerResult.fromToken.decimal);
    const toDecimals = parseInt(routerResult.toToken.decimal);

    const displayFromAmount = (Number(routerResult.fromTokenAmount) / Math.pow(10, fromDecimals)).toFixed(6);

    const displayToAmount = (Number(routerResult.toTokenAmount) / Math.pow(10, toDecimals)).toFixed(6);

    return {
      success: txReceipt.status === 1 ? true : false,
      transactionId: txReceipt.hash,
      explorerUrl: `${this.networkConfig.explorer}/${txReceipt.hash}`,
      details: {
        fromToken: {
          symbol: routerResult.fromToken.tokenSymbol,
          amount: displayFromAmount,
          decimal: routerResult.fromToken.decimal,
        },
        toToken: {
          symbol: routerResult.toToken.tokenSymbol,
          amount: displayToAmount,
          decimal: routerResult.toToken.decimal,
        },
        priceImpact: routerResult.priceImpactPercent,
      },
    };
  }
}
