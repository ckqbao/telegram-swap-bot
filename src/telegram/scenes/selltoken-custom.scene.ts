import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { WizardContext } from 'telegraf/typings/scenes';
import { CallbackQuery, Message as TgMessage, Update } from 'telegraf/typings/core/types/typegram';

import { isInputAmount } from '@/common/utils/number';

import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { BaseScene } from './base.scene';
import { SELLTOKEN_CUSTOM_SCENE } from '../constants/scene';
import { SELL_X_PERCENT_TEXT } from '../bot.opts';
import { SwapService } from '../swap.service';
import { buildCancelKeyboard } from '../utils/inline-keyboard';
import { cleanScene } from '../utils/scene';

@Wizard(SELLTOKEN_CUSTOM_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SellTokenCustomScene extends BaseScene {
  @Inject()
  private readonly swapService: SwapService;

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
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
  @WizardStep(2)
  async onAddress(
    @Ctx() ctx: WizardContext & { update?: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> },
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
