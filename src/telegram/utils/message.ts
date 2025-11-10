import { InlineKeyboardMarkup, Message } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf/typings/markup';
import { Context } from '../interfaces/context.interface';

export function isBotCommand(msg: Message.TextMessage) {
  const { entities } = msg;
  const cmdEntity = entities?.[0];
  return msg.text.startsWith('/') && cmdEntity?.type === 'bot_command' && cmdEntity?.offset === 0;
}

export async function replyWithInlineKeyboardMenu(
  ctx: Context,
  caption: string,
  keyboard: Markup<InlineKeyboardMarkup>,
) {
  const inlineKeyboardMenuMsgId = ctx.session.inlineKeyboardMenuMsgId;

  if (inlineKeyboardMenuMsgId) {
    await ctx.telegram.editMessageText(ctx.chat?.id, inlineKeyboardMenuMsgId, undefined, caption, {
      parse_mode: 'HTML',
      reply_markup: keyboard.reply_markup,
    });
    return;
  }

  const message = await ctx.replyWithHTML(caption, keyboard);
  ctx.session.inlineKeyboardMenuMsgId = message.message_id;
  return;
}

export async function replyWithDataQueryRepliedMessage(
  ctx: Context,
  data: string,
  caption: string,
  parentMsgId?: number,
) {
  const dataQueryRepliedMessage = ctx.session.dataQueryRepliedMessage;

  if (dataQueryRepliedMessage) {
    await ctx.deleteMessage(dataQueryRepliedMessage.msgId);
  }

  const msg = await ctx.replyWithHTML(caption, { reply_markup: { force_reply: true } });
  ctx.session.dataQueryRepliedMessage = {
    data,
    parentMsgId,
    msgId: msg.message_id,
  };
  return msg;
}
