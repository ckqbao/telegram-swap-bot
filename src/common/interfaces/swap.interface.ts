import { Hex } from 'viem';
import { ChainKey } from '@/common/constants';

export type SwapStatus = 'approving' | 'already-approved' | 'approved' | 'swapping' | 'submitted';

export type OnStatusUpdate = (status: SwapStatus) => Promise<void>;

export type SwapSettlement = {
  success: boolean;
  transactionId: string;
  explorerUrl: string;
  error?: string;
};

export type OnSwapSettled = (settlement: SwapSettlement) => Promise<void> | void;

export type ApprovalStrategy =
  | 'unlimited' // Approve max uint256 (convenient but risky)
  | 'exact' // Approve exact amount needed (safest, approve each time)
  | 'multiple'; // Approve multiple of swap amount (balanced)

export type SwapConfig = {
  privateKey: string;
  chain: ChainKey;
  fromTokenAddress: Hex;
  fromTokenDecimals: number;
  toTokenAddress: Hex;
  amountToSwap: string; // real amount in string, e.g. "0.001"
  slippage: number;
  deadline?: number;
  approvalStrategy?: ApprovalStrategy; // Default: 'unlimited'
  approvalMultiplier?: number; // For 'multiple' strategy, default: 100x
  approveOnly?: boolean;
};

export class SwapAmountTooLowError extends Error {
  constructor() {
    super('Swap amount is too low to be routed by the provider');
    this.name = 'SwapAmountTooLowError';
  }
}

export interface Swap {
  readonly nativeTokenAddress: Hex;
  /**
   * Resolves once the swap transaction has been submitted to the network.
   * Whether it actually succeeded is reported later through `onSettled`,
   * so multiple swaps can be fired without waiting for confirmations.
   */
  performSwap(config: SwapConfig, onStatusUpdate?: OnStatusUpdate, onSettled?: OnSwapSettled): Promise<void>;
}
