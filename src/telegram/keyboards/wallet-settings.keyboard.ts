import { InlineKeyboardMarkup } from '@telegraf/types';
import { Markup } from 'telegraf';
import { walletButtons } from '../buttons/wallet.buttons';
import { backKeyboard, closeKeyboard } from './common.keyboard';

export function walletSettingsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(walletButtons.createWallet.label, walletButtons.createWallet.callback)],
    [Markup.button.callback(walletButtons.importWallet.label, walletButtons.importWallet.callback)],
    [...backKeyboard().reply_markup.inline_keyboard.flat(), ...closeKeyboard().reply_markup.inline_keyboard.flat()],
  ]);
}
