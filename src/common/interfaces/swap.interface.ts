import { Hex } from 'viem';

export type SwapStatus = 'approving' | 'already-approved' | 'approved' | 'swapping';

export type OnStatusUpdate = (status: SwapStatus) => Promise<void>;

export type ApprovalStrategy =
  | 'unlimited' // Approve max uint256 (convenient but risky)
  | 'exact' // Approve exact amount needed (safest, approve each time)
  | 'multiple'; // Approve multiple of swap amount (balanced)

export type SwapConfig = {
  privateKey: string;
  fromTokenAddress: Hex;
  fromTokenDecimals: number;
  toTokenAddress: Hex;
  amountToSwap: string; // real amount in string, e.g. "0.001"
  slippage: number;
  deadline?: number;
  approvalStrategy?: ApprovalStrategy; // Default: 'unlimited'
  approvalMultiplier?: number; // For 'multiple' strategy, default: 100x
};

export interface Swap {
  readonly nativeTokenAddress: Hex;
  performSwap(config: SwapConfig, onStatusUpdate?: OnStatusUpdate): Promise<void>;
}
