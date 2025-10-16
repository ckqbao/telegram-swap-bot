import { InlineKeyboardButton } from '@telegraf/types';
import { Command } from '../constants/command';
import { Markup } from 'telegraf';

export function buildInlineKeyboard(
  keyboards: { text: string; command: string }[][],
): InlineKeyboardButton.CallbackButton[][] {
  return keyboards.map((rowItems) =>
    rowItems.map((item) =>
      Markup.button.callback(
        item.text,
        JSON.stringify({
          command: item.command ?? Command.DUMMY,
        }),
      ),
    ),
  );
}

export function buildCancelKeyboard() {
  return buildInlineKeyboard([[{ text: '❌ Cancel', command: Command.CANCEL }]]);
}

export function buildCloseKeyboard() {
  return buildInlineKeyboard([[{ text: '❌ Close', command: Command.DISMISS_MESSAGE }]]);
}
