import { Injectable } from '@nestjs/common';
import { Screen } from '../interfaces/screen.interface';
import {
  birdeyeLink,
  contractLink,
  copytoclipboard,
  dexscreenerLink,
  dextoolLink,
  formatKMB,
  formatPrice,
} from '@/common/utils';
import dayjs from 'dayjs';
import { Command } from '../constants/command';
import { buildInlineKeyboard } from '../utils/inline-keyboard';
// import { NATIVE_TOKEN } from '@/common/constants';

@Injectable()
export class TokenInfoScreen implements Screen {
  constructor() {}

  buildCaption(name: string, symbol: string, mint: string, price: number, mc: number): string {
    const caption =
      `Token: <b>${name ?? 'undefined'} (${symbol ?? 'undefined'})</b>\n` +
      `<i>${copytoclipboard(mint)}</i>\n\n` +
      `💲 Price: <b>$${formatPrice(price)}</b>\n` +
      `📊 Market Cap: <b>$${formatKMB(mc)}</b>\n\n` +
      `${contractLink(mint)} • ${birdeyeLink(mint)} • ${dextoolLink(mint)} • ${dexscreenerLink(mint)}\n` +
      `🕟 ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`;

    return caption;
  }

  buildInlineKeyboard({ slippage }: { buyGas: number; sellGas: number; slippage: number }) {
    return buildInlineKeyboard([
      [
        { text: 'Balance', command: Command.BALANCE },
        { text: 'Refresh', command: Command.REFRESH },
        { text: `Slippage: ${slippage}%`, command: Command.SLIPPAGE },
      ],
      // [
      //   { text: `Buy Gas: ${buyGas}${NATIVE_TOKEN}`, command: Command.BUY_GAS },
      //   { text: `Sell Gas: ${sellGas}${NATIVE_TOKEN}`, command: Command.SELL_GAS },
      //   { text: 'Jito tip', command: Command.JITO_TIP },
      // ],
      [
        { text: 'Buy 0.01 BNB', command: Command['BUYTOKEN_0.01'] },
        { text: 'Buy 0.05 BNB', command: Command['BUYTOKEN_0.05'] },
        { text: 'Buy 0.1 BNB', command: Command['BUYTOKEN_0.1'] },
      ],
      [
        { text: 'Buy 0.25 BNB', command: Command['BUYTOKEN_0.25'] },
        { text: 'Buy 0.5 BNB', command: Command['BUYTOKEN_0.5'] },
        { text: 'Buy X BNB', command: Command.BUYTOKEN_CUSTOM },
      ],
      [
        { text: 'Sell 50%', command: Command.SELLTOKEN_50 },
        { text: 'Sell 100%', command: Command.SELLTOKEN_100 },
        { text: 'Sell X %', command: Command.SELLTOKEN_X },
      ],
      [{ text: '❌ Close', command: Command.DISMISS_MESSAGE }],
    ]);
  }
}
