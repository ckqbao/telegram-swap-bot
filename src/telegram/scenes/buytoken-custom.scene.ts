import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { CallbackQuery, Message as TgMessage, Update } from 'telegraf/typings/core/types/typegram';
import { Markup } from 'telegraf';

import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { BaseScene } from './base.scene';
import { BUYTOKEN_CUSTOM_SCENE } from '../constants/scene';
import { BUY_XBNB_TEXT } from '../bot.opts';
import { SwapService } from '../swap.service';
import { Command } from '../constants/command';

@Wizard(BUYTOKEN_CUSTOM_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class BuyTokenCustomScene extends BaseScene {
  @Inject()
  private readonly swapService: SwapService;

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
    const message = await ctx.reply(BUY_XBNB_TEXT, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[Markup.button.callback('❌ Cancel', Command.CANCEL)]],
      },
    });
    this.addMessageToState(ctx, message);
    ctx.wizard.next();
  }

  @On(['callback_query', 'text'])
  @WizardStep(2)
  async onAddress(
    @Ctx() ctx: WizardContext & { update?: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> },
    @Message() msg: TgMessage.TextMessage,
  ) {
    const { from } = ctx;
    const { fromMsg } = ctx.wizard.state as { fromMsg: TgMessage.TextMessage | undefined };
    if (!from || !fromMsg) return this.showUnexpectedError(ctx);

    const { data } = ctx.update?.callback_query ?? {};
    if (data === Command.CANCEL) return this.abortScene(ctx);

    this.addMessageToState(ctx, msg);

    const messageText = msg.text;

    const regex = /^[0-9]+(\.[0-9]+)?$/;
    const isNumber = regex.test(messageText) === true;

    if (!isNumber) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    const amount = Number(messageText);
    await this.swapService.buyToken(fromMsg, amount, from.id);
    await this.cleanScene(ctx);
    await ctx.scene.leave();
    return;
  }
}
