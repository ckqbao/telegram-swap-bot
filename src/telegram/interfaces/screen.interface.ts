import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

export interface Screen {
  buildCaption(...args: any[]): string | Promise<string>;
  buildFailedCaption?(...args: any[]): string | Promise<string>;
  buildInlineKeyboard?(...args: any[]): InlineKeyboardButton.CallbackButton[][];
}
