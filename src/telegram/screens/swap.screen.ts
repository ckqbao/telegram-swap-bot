import { Injectable } from '@nestjs/common';
import { Screen } from '../interfaces/screen.interface';

@Injectable()
export class SwapScreen implements Screen {
  constructor() {}

  buildCaption(amount: number, tokenSymbol: string, swapAction: 'buy' | 'sell') {
    if (swapAction === 'buy') {
      return `Buy ${amount} ${tokenSymbol} succeed`;
    } else {
      return `Sell ${amount} ${tokenSymbol} succeed`;
    }
  }

  buildFailedCaption(amount: number, tokenSymbol: string, swapAction: 'buy' | 'sell') {
    if (swapAction === 'buy') {
      return `Buy ${amount} ${tokenSymbol} failed`;
    } else {
      return `Sell ${amount} ${tokenSymbol} failed`;
    }
  }

  buildStatusCaption(status: 'approving' | 'approved' | 'swapping') {
    switch (status) {
      case 'approving':
        return 'Approving token...';
      case 'approved':
        return 'Token approved!';
      case 'swapping':
        return 'Executing swap transaction...';
    }
  }
}
