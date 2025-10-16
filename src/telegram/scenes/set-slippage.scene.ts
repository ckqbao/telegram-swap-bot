import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { Message as TgMessage } from 'telegraf/typings/core/types/typegram';
import { WizardContext } from 'telegraf/typings/scenes';

import { isInputAmount } from '@/common/utils/number';
import { PreferenceRepository } from '@/database/repository';

import { BaseScene } from './base.scene';
import { SET_SLIPPAGE_SCENE } from '../constants/scene';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { SET_SLIPPAGE_TEXT } from '../bot.opts';
import { buildCancelKeyboard } from '../utils/inline-keyboard';
import { TokenService } from '../token.service';
import { cleanScene } from '../utils/scene';

@Wizard(SET_SLIPPAGE_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetSlippageScene extends BaseScene {
  @Inject()
  private readonly preferenceRepository: PreferenceRepository;
  @Inject()
  private readonly tokenService: TokenService;

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
    const message = await ctx.reply(SET_SLIPPAGE_TEXT, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buildCancelKeyboard() },
    });
    this.addMessageToState(ctx, message);
    ctx.wizard.next();
  }

  @On('text')
  @WizardStep(2)
  async onWalletName(@Ctx() ctx: WizardContext, @Message() msg: TgMessage.TextMessage) {
    const { from } = ctx;
    const { fromMsg } = ctx.wizard.state as { fromMsg: TgMessage.TextMessage | undefined };
    if (!from || !fromMsg) return this.showUnexpectedError(ctx);

    this.addMessageToState(ctx, msg);
    const messageText = msg.text;

    if (!isInputAmount(messageText)) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    await this.preferenceRepository.setSlippage(from.id, Number(messageText));
    await this.tokenService.refreshTokenInfoScreen(fromMsg, from);
    await cleanScene(ctx);
    return ctx.scene.leave();
  }
}
