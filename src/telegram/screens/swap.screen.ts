import { Injectable } from '@nestjs/common';
import { Screen } from '../interfaces/screen.interface';

@Injectable()
export class SwapScreen implements Screen {
  constructor() {}

  buildCaption(swapAction: 'buy' | 'sell') {
    if (swapAction === 'buy') {
      return 'Buy succeed';
    } else {
      return 'Sell succeed';
    }
  }

  buildFailedCaption(swapAction: 'buy' | 'sell') {
    if (swapAction === 'buy') {
      return 'Buy failed';
    } else {
      return 'Sell failed';
    }
  }
}
