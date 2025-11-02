import { InlineKeyboardMarkup } from '@telegraf/types';
import { Markup } from 'telegraf';
import { walletButtons } from '../buttons/wallet.buttons';
import { closeKeyboard } from './common.keyboard';

export function mainKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(walletButtons.wallets.label, walletButtons.wallets.callback)],
    ...closeKeyboard().reply_markup.inline_keyboard,
  ]);
}
