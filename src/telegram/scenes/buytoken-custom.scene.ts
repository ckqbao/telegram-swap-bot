import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { CallbackQuery, Message as TgMessage, Update } from 'telegraf/typings/core/types/typegram';

import { BaseScene } from './base.scene';
import { BUY_X_BNB_TEXT } from '../bot.opts';
import { SceneEnum } from '../enums/scene.enum';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { Context } from '../interfaces/context.interface';
import { SwapService } from '../swap.service';
import { buildCancelKeyboard } from '../utils/inline-keyboard';
import { cleanScene } from '../utils/scene';

enum BuyTokenCustomSteps {
  ENTER,
  BUY_TOKEN,
}

@Wizard(SceneEnum.BUYTOKEN_CUSTOM_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class BuyTokenCustomScene extends BaseScene {
  @Inject()
  private readonly swapService: SwapService;

  @WizardStep(BuyTokenCustomSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context) {
    const message = await ctx.reply(BUY_X_BNB_TEXT, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buildCancelKeyboard(),
      },
    });
    this.addMessageToState(ctx, message);
    ctx.wizard.next();
  }

  @On('text')
  @WizardStep(BuyTokenCustomSteps.BUY_TOKEN)
  async onBuyToken(
    @Ctx() ctx: Context & { update?: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> },
    @Message() msg: TgMessage.TextMessage,
  ) {
    const { from } = ctx;
    const { fromMsg } = ctx.wizard.state as { fromMsg: TgMessage.TextMessage | undefined };
    if (!from || !fromMsg) return this.showUnexpectedError(ctx);

    this.addMessageToState(ctx, msg);

    const messageText = msg.text;

    const regex = /^[0-9]+(\.[0-9]+)?$/;
    const isNumber = regex.test(messageText) === true;

    if (!isNumber) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    const amount = messageText;
    await this.swapService.buyToken(fromMsg, amount, from.id);
    await cleanScene(ctx);
    await ctx.scene.leave();
    return;
  }
}
