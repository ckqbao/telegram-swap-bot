import { Command, SceneLeave } from 'nestjs-telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { buildCloseKeyboard } from '../utils/inline-keyboard';
import { cleanScene } from '../utils/scene';
import { Context } from '../interfaces/context.interface';

export abstract class BaseScene {
  @Command('cancel')
  async abortScene(ctx: Context) {
    await ctx.scene.leave();
    return;
  }

  @SceneLeave()
  async onSceneLeave(ctx: Context) {
    await cleanScene(ctx);
  }

  addMessageToState(ctx: Context, msg: Message.TextMessage) {
    const { messages = [] } = ctx.scene.state as { messages?: Message.TextMessage[] };
    ctx.scene.state = { ...ctx.scene.state, messages: [...messages, msg] };
  }

  async selectStep(ctx: Context, step: number) {
    ctx.wizard.selectStep(step);
    const wizard = ctx.wizard as any;
    await wizard.steps[ctx.wizard.cursor](ctx);
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
