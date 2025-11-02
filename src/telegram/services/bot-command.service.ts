import { Injectable } from '@nestjs/common';
import { Message } from '@telegraf/types';
import { Context } from '../interfaces/context.interface';

@Injectable()
export class BotCommandService {
  constructor() {}

  async process(ctx: Context, handler: () => Promise<unknown>) {
    await handler();
    await this.onAfterCommand(ctx);
  }

  private async onAfterCommand(ctx: Context) {
    if (!ctx.message) return;

    const { entities } = ctx.message as Message.TextMessage;
    const cmdEntity = entities?.[0];
    if (cmdEntity?.type !== 'bot_command' || cmdEntity?.offset > 0) return;

    await ctx.deleteMessage(ctx.message.message_id);
  }
}
