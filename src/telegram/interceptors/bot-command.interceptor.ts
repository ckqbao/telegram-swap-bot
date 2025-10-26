import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { Context } from '../interfaces/context.interface';

@Injectable()
export class BotCommandInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const ctx = TelegrafExecutionContext.create(context).getContext<Context>();
    console.log('agjaelgjl');
    void this.deleteBotCommandMessage(ctx);

    return next.handle();
  }

  private async deleteBotCommandMessage(ctx: Context) {
    if (!ctx.message) return;

    const { entities } = ctx.message as Message.TextMessage;
    const cmdEntity = entities?.[0];
    if (cmdEntity?.type !== 'bot_command' || cmdEntity?.offset > 0) return;

    await ctx.deleteMessage(ctx.message.message_id);
  }
}
