import { InlineKeyboardMarkup } from '@telegraf/types';
import { Markup } from 'telegraf';
import { commonButtons } from '../buttons/common.buttons';

export function backKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([Markup.button.callback(commonButtons.back.label, commonButtons.back.callback)]);
}

export function cancelKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([Markup.button.callback(commonButtons.cancel.label, commonButtons.cancel.callback)]);
}

export function closeKeyboard(): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([Markup.button.callback(commonButtons.close.label, commonButtons.close.callback)]);
}
