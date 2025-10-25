import { Injectable } from '@nestjs/common';
import { Screen } from '../interfaces/screen.interface';
import { SwapStatus } from '@/common/interfaces/swap.interface';

@Injectable()
export class SwapScreen implements Screen {
  constructor() {}

  buildCaption(amount: string, tokenSymbol: string, swapAction: 'buy' | 'sell') {
    if (swapAction === 'buy') {
      return `Buy ${amount} ${tokenSymbol} succeed`;
    } else {
      return `Sell ${amount} ${tokenSymbol} succeed`;
    }
  }

  buildFailedCaption(amount: string, tokenSymbol: string, swapAction: 'buy' | 'sell') {
    if (swapAction === 'buy') {
      return `Buy ${amount} ${tokenSymbol} failed`;
    } else {
      return `Sell ${amount} ${tokenSymbol} failed`;
    }
  }

  buildStatusCaption(status: SwapStatus) {
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
}
