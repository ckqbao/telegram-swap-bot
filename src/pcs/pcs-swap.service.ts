import { Inject, Injectable, Logger } from '@nestjs/common';
import { Hex, PrivateKeyAccount, parseUnits } from 'viem';
import { nonceManager, privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { CurrencyAmount, TradeType, Percent, Native } from '@pancakeswap/sdk';
import { SMART_ROUTER_ADDRESSES, SmartRouter, SwapRouter } from '@pancakeswap/smart-router';
import { MAIN_CHAIN_ID } from '@/common/constants';
import { VIEM_PUBLIC_CLIENT } from '@/common/constants/provider.constant';
import { OnStatusUpdate, Swap, SwapConfig } from '@/common/interfaces/swap.interface';
import { ViemPublicClient } from '@/common/providers';
import { TokenApprovalService } from '@/common/services/token-approval.service';
import { PcsPoolService } from './pcs-pool.service';
import { PcsTokenMetadataService } from './pcs-token-metadata.service';

@Injectable()
export class PcsSwapService implements Swap {
  private readonly logger = new Logger(PcsSwapService.name);
  readonly nativeTokenAddress = Native.onChain(MAIN_CHAIN_ID).asToken.address;

  constructor(
    @Inject(VIEM_PUBLIC_CLIENT) private readonly viemPublicClient: ViemPublicClient,
    private readonly pcsPoolService: PcsPoolService,
    private readonly pcsTokenMetadataService: PcsTokenMetadataService,
    private readonly tokenApprovalService: TokenApprovalService,
  ) {}

  async performSwap(config: SwapConfig, onStatusUpdate?: OnStatusUpdate): Promise<void> {
    try {
      const account = privateKeyToAccount(config.privateKey as Hex, { nonceManager });
      const {
        amountToSwap,
        fromTokenAddress,
        fromTokenDecimals,
        toTokenAddress,
        slippage,
        approvalStrategy,
        approvalMultiplier,
      } = config;

      const amount = parseUnits(amountToSwap, fromTokenDecimals);

      if (!this.isNativeSwap(fromTokenAddress)) {
        await this.tokenApprovalService.approveIfNeeded(
          {
            tokenAddress: fromTokenAddress,
            walletAddress: account.address,
            spenderAddress: SMART_ROUTER_ADDRESSES[MAIN_CHAIN_ID],
            requiredAmount: amount,
          },
          onStatusUpdate,
        );
      }

      await onStatusUpdate?.('swapping');

      const txHash = await this.executeSwapTransaction(account, fromTokenAddress, toTokenAddress, amount, slippage);

      this.logger.log(`Swap transaction sent. Hash: ${txHash}`);

      // Wait for transaction receipt
      await this.viemPublicClient.waitForTransactionReceipt({
        hash: txHash,
        confirmations: 1,
      });
      this.logger.log(`Transaction is included in block at ${new Date().toISOString()}`);
    } catch (error) {
      this.logger.error(`Failed to perform swap: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Execute swap transaction using Smart Router
   */
  private async executeSwapTransaction(
    account: PrivateKeyAccount,
    fromTokenAddress: Hex,
    toTokenAddress: Hex,
    amountIn: bigint,
    slippage: number,
    deadline?: number,
  ): Promise<Hex> {
    try {
      const isNativeSwap = this.isNativeSwap(fromTokenAddress);

      // Fetch token metadata for building the swap call
      const [tokenAddressData] = await this.pcsTokenMetadataService.getTokenMetadata([
        isNativeSwap ? toTokenAddress : fromTokenAddress,
      ]);

      const tokenInData = isNativeSwap ? Native.onChain(MAIN_CHAIN_ID) : tokenAddressData;
      const tokenOutData = isNativeSwap ? tokenAddressData : Native.onChain(MAIN_CHAIN_ID);

      // Create currency amount
      const currencyAmountIn = CurrencyAmount.fromRawAmount(tokenInData, amountIn.toString());

      // Get cached or fetch new pools
      const pools = await this.pcsPoolService.getPools(tokenInData, tokenOutData);

      // Create quote provider
      const quoteProvider = SmartRouter.createQuoteProvider({
        onChainProvider: () => this.viemPublicClient,
      });

      // Get best trade using static pool provider with cached pools
      const trade = await SmartRouter.getBestTrade(currencyAmountIn, tokenOutData, TradeType.EXACT_INPUT, {
        gasPriceWei: () => this.viemPublicClient.getGasPrice(),
        maxHops: 3,
        maxSplits: 3,
        poolProvider: SmartRouter.createStaticPoolProvider(pools),
        quoteProvider,
        quoterOptimization: true,
      });

      if (!trade) {
        throw new Error('No trade route found for swap execution');
      }

      // Get estimated amount out
      const amountOut = BigInt(trade.outputAmount.quotient.toString());

      // Calculate minimum amount out with slippage
      const minAmountOut = amountOut - (amountOut * BigInt(Math.floor(slippage * 100))) / 10000n;

      this.logger.log(
        `Executing swap: ${amountIn.toString()} -> estimated ${amountOut.toString()}, min ${minAmountOut.toString()}`,
      );

      const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      // Build the swap call using Smart Router
      const { calldata, value } = SwapRouter.swapCallParameters(trade, {
        recipient: account.address,
        slippageTolerance: new Percent(50, 10000), // 0.5% slippage
        deadlineOrPreviousBlockhash: BigInt(swapDeadline),
      });

      this.logger.log(`Executing swap with calldata length: ${calldata.length}`);

      // Send the transaction
      const txHash = await this.viemPublicClient.sendTransaction({
        account,
        to: SMART_ROUTER_ADDRESSES[MAIN_CHAIN_ID],
        data: calldata,
        value: BigInt(value),
        chain: bsc,
        kzg: undefined,
      });

      return txHash;
    } catch (error) {
      this.logger.error(`Failed to execute swap transaction: ${error.message}`, error.stack);
      throw error;
    }
  }

  private isNativeSwap(fromTokenAddress: Hex): boolean {
    return fromTokenAddress === this.nativeTokenAddress;
  }
}
