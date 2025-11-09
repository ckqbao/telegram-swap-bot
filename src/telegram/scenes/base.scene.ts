import { Message } from 'telegraf/typings/core/types/typegram';
import { buildCloseKeyboard } from '../utils/inline-keyboard';
import { Context } from '../interfaces/context.interface';

export class BaseScene {
  addSceneMessage(ctx: Context, msg: Message.TextMessage) {
    const { messages = [] } = ctx.scene.state as { messages?: Message.TextMessage[] };
    ctx.scene.state = { ...ctx.scene.state, messages: [...messages, msg] };
  }

  async deleteStepMessages(ctx: Context) {
    const { messages = [] } = ctx.scene.state as { messages?: Message.TextMessage[] };
    if (messages?.length) {
      await ctx.deleteMessages(messages.map((msg) => msg.message_id));
    }
  }

  async selectStep(ctx: Context, step: number, next: () => Promise<void>) {
    ctx.wizard.selectStep(step);
    const wizardStep = ctx.wizard.step;
    if (typeof wizardStep === 'function') {
      await wizardStep(ctx, next);
    }
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
