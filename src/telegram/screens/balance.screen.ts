import { Injectable } from '@nestjs/common';
import { formatUnits, Hex } from 'viem';
import { TokensInfo } from '@/1inch/types/token';
import { NATIVE_TOKEN_DECIMALS } from '@/common/constants';
import { Screen } from '../interfaces/screen.interface';
import { Command } from '../constants/command';
import { buildInlineKeyboard } from '../utils/inline-keyboard';

@Injectable()
export class BalanceScreen implements Screen {
  constructor() {}

  buildCaption(tokenBalances: Record<Hex, bigint>, tokenInfos: TokensInfo) {
    const caption = Object.entries(tokenBalances)
      .map(([tokenAddress, balance]) => {
        const tokenInfo = tokenInfos[tokenAddress as Hex];
        const symbol = tokenInfo ? tokenInfo.symbol : tokenAddress;
        return `${symbol}: ${formatUnits(balance, tokenInfo?.decimals ?? NATIVE_TOKEN_DECIMALS)}`;
      })
      .join('\n');

    return caption || 'No balance';
  }

  buildInlineKeyboard() {
    return buildInlineKeyboard([[{ text: '❌ Close', command: Command.DISMISS_MESSAGE }]]);
  }
}
