import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { CallbackQuery, Message as TgMessage, Update } from 'telegraf/typings/core/types/typegram';

import { isInputAmount } from '@/common/utils/number';

import { BaseScene } from './base.scene';
import { SELL_X_PERCENT_TEXT } from '../bot.opts';
import { SceneEnum } from '../enums/scene.enum';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { Context } from '../interfaces/context.interface';
import { SwapService } from '../swap.service';
import { buildCancelKeyboard } from '../utils/inline-keyboard';
import { cleanScene } from '../utils/scene';

enum SellTokenCustomSteps {
  ENTER,
  SELL_TOKEN,
}

@Wizard(SceneEnum.SELLTOKEN_CUSTOM_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SellTokenCustomScene extends BaseScene {
  @Inject()
  private readonly swapService: SwapService;

  @WizardStep(SellTokenCustomSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context) {
    const message = await ctx.reply(SELL_X_PERCENT_TEXT, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buildCancelKeyboard(),
      },
    });
    this.addMessageToState(ctx, message);
    ctx.wizard.next();
  }

  @On('text')
  @WizardStep(SellTokenCustomSteps.SELL_TOKEN)
  async onSellToken(
    @Ctx() ctx: Context & { update?: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> },
    @Message() msg: TgMessage.TextMessage,
  ) {
    const { from } = ctx;
    const { fromMsg } = ctx.wizard.state as { fromMsg: TgMessage.TextMessage | undefined };
    if (!from || !fromMsg) return this.showUnexpectedError(ctx);

    this.addMessageToState(ctx, msg);

    const messageText = msg.text;

    if (!isInputAmount(messageText)) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    const percent = Number(messageText);
    await this.swapService.sellToken(fromMsg, percent, from.id);
    await cleanScene(ctx);
    await ctx.scene.leave();
    return;
  }
}
