import { capitalize } from 'lodash';
import { SwapStatus } from '@/common/interfaces/swap.interface';

export function swapSuccessCaption(
  amount: string,
  tokenSymbol: string,
  swapAction: 'buy' | 'sell',
  totalSwapDuration: number,
) {
  return `${capitalize(swapAction)} ${amount} ${tokenSymbol} succeed. Total swap duration: ${totalSwapDuration} ms`;
}

export function swapFailureCaption(amount: string, tokenSymbol: string, swapAction: 'buy' | 'sell') {
  if (swapAction === 'buy') {
    return `Buy ${amount} ${tokenSymbol} failed`;
  } else {
    return `Sell ${amount} ${tokenSymbol} failed`;
  }
}

export function swapStatusCaption(status: SwapStatus) {
  switch (status) {
    case 'approving':
      return 'Approving token...';
    case 'already-approved':
      return 'Token already approved!';
    case 'approved':
      return 'Token approved!';
    case 'swapping':
      return 'Executing swap transaction...';
  }
}
