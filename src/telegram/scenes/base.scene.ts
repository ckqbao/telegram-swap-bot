import { Command } from 'nestjs-telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { buildCloseKeyboard } from '../utils/inline-keyboard';
import { cleanScene } from '../utils/scene';
import { Context } from '../interfaces/context.interface';

export abstract class BaseScene {
  @Command('cancel')
  async abortScene(ctx: Context) {
    await cleanScene(ctx);
    await ctx.scene.leave();
    return;
  }

  addMessageToState(ctx: Context, msg: Message.TextMessage) {
    const { messages = [] } = ctx.scene.state as { messages?: Message.TextMessage[] };
    ctx.scene.state = { ...ctx.scene.state, messages: [...messages, msg] };
  }

  async showUnexpectedError(ctx: Context) {
    await ctx.reply('Unexpected error occured. Please try again.', {
      reply_markup: {
        inline_keyboard: buildCloseKeyboard(),
      },
    });
    await ctx.scene.leave();
    return;
  }
}
