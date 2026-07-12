import { InlineKeyboardMarkup } from '@telegraf/types';
import { chunk } from 'lodash';
import { Markup } from 'telegraf';
import { ChainKey, CHAIN_KEYS, getChain } from '@/common/constants';
import { chainButtons } from '../buttons/chain.buttons';
import { walletButtons } from '../buttons/wallet.buttons';
import { closeKeyboard } from './common.keyboard';
import { tokenButtons } from '../buttons/token.buttons';

export function mainKeyboard(chainKey: ChainKey): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⛓ Chain: ${getChain(chainKey).label}`, chainButtons.chainSelect.callback)],
    [Markup.button.callback(tokenButtons.tokenSettings.label, tokenButtons.tokenSettings.callback)],
    [Markup.button.callback(walletButtons.wallets.label, walletButtons.wallets.callback)],
    ...closeKeyboard().reply_markup.inline_keyboard,
  ]);
}

export function chainSelectKeyboard(current: ChainKey): Markup.Markup<InlineKeyboardMarkup> {
  const chainButtonRows = chunk(
    CHAIN_KEYS.map((key) =>
      Markup.button.callback(
        `${key === current ? '✅ ' : ''}${getChain(key).label}`,
        `${chainButtons.setChainPrefix}${key}`,
      ),
    ),
    2,
  );
  return Markup.inlineKeyboard([...chainButtonRows, ...closeKeyboard().reply_markup.inline_keyboard]);
}
