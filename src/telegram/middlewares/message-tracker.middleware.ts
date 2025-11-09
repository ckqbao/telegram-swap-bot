import { Injectable } from '@nestjs/common';
import { MiddlewareFn } from 'telegraf';
import { Context } from '../interfaces/context.interface';

@Injectable()
export class MessageTrackerMiddleware {
  middleware(): MiddlewareFn<Context> {
    return async (ctx, next) => {
      this.extendDeleteMessage(ctx);
      return next();
    };
  }

  private extendDeleteMessage(ctx: Context) {
    const originalDelete = ctx.deleteMessage.bind(ctx);
    ctx.deleteMessage = async (messageId?: number) => {
      const msgId = messageId ?? ctx.msgId;
      const result = await originalDelete(msgId);
      if (msgId === ctx.session.trackedMessageId) {
        ctx.session.trackedMessageId = undefined;
      }
      return result;
    };
  }
}
