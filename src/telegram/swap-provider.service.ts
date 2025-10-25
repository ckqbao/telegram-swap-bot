import { OnStatusUpdate, Swap, SwapConfig } from '@/common/interfaces/swap.interface';
import { Hex } from 'viem';

export abstract class SwapProviderService implements Swap {
  readonly nativeTokenAddress: Hex;
  abstract performSwap(config: SwapConfig, onStatusUpdate?: OnStatusUpdate): Promise<void>;
}
