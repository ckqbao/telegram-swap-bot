import { Command } from 'nestjs-telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { WizardContext } from 'telegraf/typings/scenes';
import z from 'zod';
import { buildCloseKeyboard } from '../utils/inline-keyboard';

export abstract class BaseScene {
  @Command('cancel')
  async abortScene(ctx: WizardContext) {
    await this.cleanScene(ctx);
    await ctx.scene.leave();
    return;
  }

  addMessageToState(ctx: WizardContext, msg: Message.TextMessage) {
    const { messages = [] } = ctx.scene.state as { messages?: Message.TextMessage[] };
    ctx.scene.state = { ...ctx.scene.state, messages: [...messages, msg] };
  }

  async cleanScene(ctx: WizardContext) {
    const parsed = z
      .looseObject({ messages: z.array(z.object({ message_id: z.number() })) })
      .safeParse(ctx.scene.state);

    if (!parsed.success) return;

    const { messages } = parsed.data;
    const messageIds = messages.map((message) => message.message_id);
    await ctx.deleteMessages(messageIds);
  }

  async showUnexpectedError(ctx: WizardContext) {
    await ctx.reply('Unexpected error occured. Please try again.', {
      reply_markup: {
        inline_keyboard: buildCloseKeyboard(),
      },
    });
    await ctx.scene.leave();
    return;
  }
}
