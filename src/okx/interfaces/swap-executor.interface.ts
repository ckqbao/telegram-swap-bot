import { SwapParams, SwapResponseData, SwapResult } from '@okx-dex/okx-dex-sdk';

export type SwapSettlement = {
  success: boolean;
  transactionId: string;
  explorerUrl: string;
  error?: string;
};

export type OnSwapSettled = (settlement: SwapSettlement) => Promise<void> | void;

export interface SwapExecutor {
  executeSwap(swapData: SwapResponseData, params: SwapParams, onSettled?: OnSwapSettled): Promise<SwapResult>;
  handleTokenApproval?(chainIndex: string, tokenAddress: string, amount: string): Promise<{ transactionHash: string }>;
}
