import { Injectable } from '@nestjs/common';
import { MiddlewareFn } from 'telegraf';
import { Context } from '../interfaces/context.interface';

@Injectable()
export class DeleteMessageMiddleware {
  middleware(): MiddlewareFn<Context> {
    return async (ctx, next) => {
      this.extendDeleteMessage(ctx);
      this.extendDeleteMessages(ctx);
      return next();
    };
  }

  private extendDeleteMessage(ctx: Context) {
    const originalDelete = ctx.deleteMessage.bind(ctx);
    ctx.deleteMessage = async (messageId?: number) => {
      const msgId = messageId ?? ctx.msgId;
      const result = await originalDelete(msgId);
      if (msgId === ctx.session.inlineKeyboardMenuMsgId) {
        ctx.session.inlineKeyboardMenuMsgId = undefined;
      }
      if (msgId === ctx.session.dataQueryRepliedMessage?.msgId) {
        ctx.session.dataQueryRepliedMessage = undefined;
      }
      return result;
    };
  }

  private extendDeleteMessages(ctx: Context) {
    const originalDeleteMessages = ctx.deleteMessages.bind(ctx);
    ctx.deleteMessages = async (messageIds: number[]) => {
      const result = await originalDeleteMessages(messageIds);
      if (ctx.session.inlineKeyboardMenuMsgId && messageIds.includes(ctx.session.inlineKeyboardMenuMsgId)) {
        ctx.session.inlineKeyboardMenuMsgId = undefined;
      }
      if (ctx.session.dataQueryRepliedMessage && messageIds.includes(ctx.session.dataQueryRepliedMessage.msgId)) {
        ctx.session.dataQueryRepliedMessage = undefined;
      }
      return result;
    };
  }
}
