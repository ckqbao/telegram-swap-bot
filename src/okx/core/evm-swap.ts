import { ethers, TransactionReceipt } from 'ethers';
import { SwapParams, SwapResponseData, SwapResult, ChainConfig, OKXConfig } from '@okx-dex/okx-dex-sdk';
import { SwapExecutor, OnSwapSettled } from '../interfaces/swap-executor.interface';
import { walletNonceManager } from './nonce-manager';
import { Logger } from '@nestjs/common';

// Fixed gas price in wei per chain id; chains not listed use the default
const DEFAULT_FIXED_GAS_PRICE = BigInt(150000000); // 0.15 Gwei
const FIXED_GAS_PRICE_BY_CHAIN: Record<string, bigint> = {
  '4663': BigInt(120000000), // Robinhood Chain: 0.12 Gwei
};

export class EvmSwapExecutor implements SwapExecutor {
  private readonly logger = new Logger(EvmSwapExecutor.name);
  private readonly provider: ethers.Provider;
  private readonly walletAddress: string;
  private readonly DEFAULT_GAS_MULTIPLIER = BigInt(150); // 1.5x

  constructor(
    private readonly config: OKXConfig,
    private readonly networkConfig: ChainConfig,
  ) {
    if (!this.config.evm?.wallet) {
      throw new Error('EVM configuration required');
    }
    this.provider = this.config.evm.wallet.provider;
    this.walletAddress = this.config.evm.wallet.address;
  }

  /**
   * Submits the swap transaction and returns as soon as it is accepted by the
   * RPC node, without waiting for it to be mined. Confirmation happens in the
   * background and is reported through `onSettled`.
   */
  async executeSwap(swapData: SwapResponseData, params: SwapParams, onSettled?: OnSwapSettled): Promise<SwapResult> {
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
      const response = await this.submitEvmTransaction(tx);
      this.confirmInBackground(response.hash, onSettled);
      return this.formatSwapResult(response.hash, routerResult);
    } catch (error) {
      console.error('Swap execution failed:', error);
      throw error;
    }
  }

  private async submitEvmTransaction(tx: any): Promise<ethers.TransactionResponse> {
    if (!this.config.evm?.wallet) {
      throw new Error('EVM wallet required');
    }
    const wallet = this.config.evm.wallet;
    const maxRetries = this.networkConfig.maxRetries || 3;

    let retryCount = 0;
    while (true) {
      try {
        this.logger.log('Preparing transaction...');
        const gasMultiplier = BigInt(500); // 5x standard multiplier

        const nonce = await walletNonceManager.reserve(this.provider, this.networkConfig.id, wallet.address);

        const fixedGasPrice = FIXED_GAS_PRICE_BY_CHAIN[this.networkConfig.id] ?? DEFAULT_FIXED_GAS_PRICE;

        const transaction = {
          data: tx.data,
          to: tx.to,
          value: tx.value || '0',
          nonce,
          gasLimit: (BigInt(tx.gas || 0) * gasMultiplier) / BigInt(100),
          gasPrice: fixedGasPrice,
        };

        this.logger.log(
          `Transaction details: ${JSON.stringify({
            to: transaction.to,
            value: transaction.value,
            nonce: transaction.nonce,
            gasLimit: transaction.gasLimit.toString(),
            gasPrice: transaction.gasPrice.toString(),
          })}`,
        );

        this.logger.log('Sending transaction...');
        const response = await wallet.sendTransaction(transaction);
        this.logger.log(`Transaction sent! Hash: ${response.hash}`);
        return response;
      } catch (error: any) {
        retryCount++;
        console.error(`Transaction attempt ${retryCount} failed:`, error.message);

        // The reserved nonce may not have reached the mempool; resync from
        // chain state before the next attempt
        walletNonceManager.markStale(this.networkConfig.id, wallet.address);

        if (error.code === 'INSUFFICIENT_FUNDS') {
          throw new Error('Insufficient funds for transaction');
        }

        if (retryCount >= maxRetries) {
          console.error('Max retries reached. Last error:', error);
          throw error;
        }

        const delay = 2000 * retryCount;
        this.logger.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private confirmInBackground(hash: string, onSettled?: OnSwapSettled) {
    void (async () => {
      let success = false;
      let error: string | undefined;
      try {
        const receipt = await this.waitForReceipt(hash);
        success = receipt.status === 1;
        if (!success) {
          error = 'Transaction reverted';
          this.logger.error(`Transaction reverted: ${hash}`);
        }
      } catch (confirmError: any) {
        error = confirmError.message;
        this.logger.error(`Error confirming transaction ${hash}: ${confirmError.message}`);
        walletNonceManager.markStale(this.networkConfig.id, this.walletAddress);
      }

      try {
        await onSettled?.({
          success,
          transactionId: hash,
          explorerUrl: `${this.networkConfig.explorer}/${hash}`,
          error,
        });
      } catch (callbackError: any) {
        this.logger.error(`Settlement callback failed for ${hash}: ${callbackError.message}`);
      }
    })();
  }

  private async waitForReceipt(hash: string): Promise<TransactionReceipt> {
    let attempts = 0;
    let notFoundStreak = 0;
    const maxAttempts = 60; // 60 attempts * 0.5 seconds = 30 seconds total
    const maxNotFoundStreak = 6; // tolerate ~3 seconds of RPC indexing lag

    while (attempts < maxAttempts) {
      const receipt = await this.provider.getTransactionReceipt(hash);

      if (receipt) {
        this.logger.log(`Transaction confirmed! Hash: ${hash}, block number: ${receipt.blockNumber}`);
        return receipt;
      }

      // Check if transaction is still pending. A just-sent transaction may
      // not be indexed by the RPC node yet, so only declare it dropped
      // after several consecutive misses.
      const tx = await this.provider.getTransaction(hash);
      if (!tx) {
        notFoundStreak++;
        if (notFoundStreak >= maxNotFoundStreak) {
          const network = await this.provider.getNetwork();
          this.logger.error(`Transaction dropped. Network: ${network.name} (${network.chainId})`);
          throw new Error('Transaction dropped - check network and gas prices');
        }
      } else {
        notFoundStreak = 0;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    throw new Error('Transaction confirmation timed out - check explorer for status');
  }

  private formatSwapResult(txHash: string, routerResult: any): SwapResult {
    const fromDecimals = parseInt(routerResult.fromToken.decimal);
    const toDecimals = parseInt(routerResult.toToken.decimal);

    const displayFromAmount = (Number(routerResult.fromTokenAmount) / Math.pow(10, fromDecimals)).toFixed(6);

    const displayToAmount = (Number(routerResult.toTokenAmount) / Math.pow(10, toDecimals)).toFixed(6);

    return {
      success: true,
      transactionId: txHash,
      explorerUrl: `${this.networkConfig.explorer}/${txHash}`,
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
