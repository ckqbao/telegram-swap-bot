import { InlineKeyboardMarkup } from '@telegraf/types';
import { Markup } from 'telegraf';
import { tokenButtons } from '../buttons/token.buttons';
import { backKeyboard, closeKeyboard } from './common.keyboard';
import { DEFAULT_BUY_AMOUNTS } from '@/common/constants';
import { chunk } from 'lodash';

export function tokenInfoKeyboard({
  buyAmounts = DEFAULT_BUY_AMOUNTS,
  slippage,
  nativeSymbol,
}: {
  buyAmounts?: number[];
  slippage: number;
  nativeSymbol: string;
}): Markup.Markup<InlineKeyboardMarkup> {
  const buyButtons = [
    ...buyAmounts.map((amount) => Markup.button.callback(`${amount}`, `buy-${amount}`)),
    Markup.button.callback(`X ${nativeSymbol}`, tokenButtons.buyCustom.callback),
  ];
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(tokenButtons.refresh.label, tokenButtons.refresh.callback),
      Markup.button.callback(`${tokenButtons.slippage.label}: ${slippage}%`, tokenButtons.slippage.callback),
    ],
    ...chunk(buyButtons, 3),
    [Markup.button.callback(tokenButtons.approveToken.label, tokenButtons.approveToken.callback)],
    [
      Markup.button.callback(tokenButtons.sellQuarter.label, tokenButtons.sellQuarter.callback),
      Markup.button.callback(tokenButtons.sellOneFifth.label, tokenButtons.sellOneFifth.callback),
      Markup.button.callback(tokenButtons.sellOneThird.label, tokenButtons.sellOneThird.callback),
    ],
    [
      Markup.button.callback(tokenButtons.sellHalf.label, tokenButtons.sellHalf.callback),
      Markup.button.callback(tokenButtons.sellFull.label, tokenButtons.sellFull.callback),
      Markup.button.callback(tokenButtons.sellCustom.label, tokenButtons.sellCustom.callback),
    ],
    ...closeKeyboard().reply_markup.inline_keyboard,
  ]);
}

export function tokenSettingsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(tokenButtons.buyAmounts.label, tokenButtons.buyAmounts.callback)],
    [...backKeyboard().reply_markup.inline_keyboard.flat(), ...closeKeyboard().reply_markup.inline_keyboard.flat()],
  ]);
}
