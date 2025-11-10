import { Message } from 'telegraf/typings/core/types/typegram';
import { Context } from '../interfaces/context.interface';
import { SceneLeave } from 'nestjs-telegraf';

export class BaseScene {
  @SceneLeave()
  async onSceneLeave(ctx: Context) {
    await this.deleteStepMessages(ctx);
  }

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
}
