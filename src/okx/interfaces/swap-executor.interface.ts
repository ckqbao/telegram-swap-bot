import { SwapParams, SwapResponseData, SwapResult } from '@okx-dex/okx-dex-sdk';

export interface SwapExecutor {
  executeSwap(swapData: SwapResponseData, params: SwapParams): Promise<SwapResult>;
  handleTokenApproval?(chainIndex: string, tokenAddress: string, amount: string): Promise<{ transactionHash: string }>;
}
