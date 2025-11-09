import { InlineKeyboardMarkup, Message } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf/typings/markup';
import { Context } from '../interfaces/context.interface';

export function isBotCommand(msg: Message.TextMessage) {
  const { entities } = msg;
  const cmdEntity = entities?.[0];
  return cmdEntity?.type === 'bot_command' && cmdEntity?.offset === 0;
}

export async function replyWithTrack(ctx: Context, caption: string, keyboard: Markup<InlineKeyboardMarkup>) {
  const trackedMessageId = ctx.session.trackedMessageId;

  if (trackedMessageId) {
    await ctx.telegram.editMessageText(ctx.chat?.id, trackedMessageId, undefined, caption, {
      parse_mode: 'HTML',
      reply_markup: keyboard.reply_markup,
    });
    return;
  }

  const message = await ctx.replyWithHTML(caption, keyboard);
  ctx.session.trackedMessageId = message.message_id;
  return;
}
