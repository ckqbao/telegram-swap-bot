import { Injectable } from '@nestjs/common';
import { Message } from '@telegraf/types';
import { Context } from './interfaces/context.interface';
import { SceneEnum } from './enums/scene.enum';
import { BotCommandEnum } from './enums/bot-command.enum';

@Injectable()
export class BotCommandService {
  constructor() {}

  async start(ctx: Context) {
    await this.process(ctx, async () => {
      await ctx.scene.enter(SceneEnum.MAIN_SCENE);
    });
  }

  async setMyCommands(ctx: Context, userId: number) {
    await this.process(ctx, async () => {
      await ctx.telegram.setMyCommands(
        [
          { command: BotCommandEnum.START, description: 'Open the Start Panel' },
          { command: BotCommandEnum.WALLETS, description: 'Open the Wallet Settings Panel' },
        ],
        {
          scope: {
            type: 'chat',
            chat_id: ctx.chat?.id ?? userId,
          },
        },
      );
    });
  }

  async wallets(ctx: Context) {
    await this.process(ctx, async () => {
      await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
    });
  }

  private async process(ctx: Context, handler: () => Promise<unknown>) {
    await this.onBeforeCommand(ctx);
    await handler();
    await this.onAfterCommand(ctx);
  }

  private async onBeforeCommand(ctx: Context) {
    if (ctx.session.trackedMessageId) {
      await ctx.deleteMessage(ctx.session.trackedMessageId);
    }
  }

  private async onAfterCommand(ctx: Context) {
    if (!ctx.message) return;

    const { entities } = ctx.message as Message.TextMessage;
    const cmdEntity = entities?.[0];
    if (cmdEntity?.type !== 'bot_command' || cmdEntity?.offset > 0) return;

    await ctx.deleteMessage(ctx.message.message_id);
  }
}
