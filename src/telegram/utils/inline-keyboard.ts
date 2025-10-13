import { InlineKeyboardButton } from '@telegraf/types';
import { Command } from '../constants/command';

export function buildInlineKeyboard(
  keyboards: { text: string; command: string }[][],
): InlineKeyboardButton.CallbackButton[][] {
  return keyboards.map((rowItems) =>
    rowItems.map((item) => ({
      text: item.text,
      callback_data: JSON.stringify({
        command: item.command ?? Command.DUMMY,
      }),
    })),
  );
}
