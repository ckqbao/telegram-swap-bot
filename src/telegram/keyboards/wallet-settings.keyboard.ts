import { InlineKeyboardMarkup } from '@telegraf/types';
import { Markup } from 'telegraf';
import { walletButtons } from '../buttons/wallet.buttons';
import { backKeyboard, closeKeyboard } from './common.keyboard';
import { Wallet } from '@/database/schema/wallet.schema';

export function walletSettingsKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(walletButtons.setupWallet.label, walletButtons.setupWallet.callback)],
    [Markup.button.callback(walletButtons.setMainWallet.label, walletButtons.setMainWallet.callback)],
    [Markup.button.callback(walletButtons.deleteWallet.label, walletButtons.deleteWallet.callback)],
    [...backKeyboard().reply_markup.inline_keyboard.flat(), ...closeKeyboard().reply_markup.inline_keyboard.flat()],
  ]);
}

export function setMainWalletKeyboard(wallets: Wallet[]): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    ...wallets.map(({ address, isMain, name }) => [Markup.button.callback(!isMain ? name : `🔥 ${name}`, address)]),
    [...backKeyboard().reply_markup.inline_keyboard.flat(), ...closeKeyboard().reply_markup.inline_keyboard.flat()],
  ]);
}

export function setupWalletKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(walletButtons.createWallet.label, walletButtons.createWallet.callback)],
    [Markup.button.callback(walletButtons.importWallet.label, walletButtons.importWallet.callback)],
    [...backKeyboard().reply_markup.inline_keyboard.flat(), ...closeKeyboard().reply_markup.inline_keyboard.flat()],
  ]);
}

export function deleteWalletKeyboard(wallets: Wallet[]): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    ...wallets.map(({ address, name }) => [Markup.button.callback(name, address)]),
    [...backKeyboard().reply_markup.inline_keyboard.flat(), ...closeKeyboard().reply_markup.inline_keyboard.flat()],
  ]);
}
