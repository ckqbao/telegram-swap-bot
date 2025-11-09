import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, Message, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { Message as TgMessage } from 'telegraf/typings/core/types/typegram';

import { isInputAmount } from '@/common/utils/number';
import { PreferenceRepository } from '@/database/repository';

import { BaseScene } from './base.scene';
import { SET_SLIPPAGE_TEXT } from '../bot.opts';
import { SceneEnum } from '../enums/scene.enum';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { Context } from '../interfaces/context.interface';
import { TokenService } from '../token.service';
import { buildCancelKeyboard } from '../utils/inline-keyboard';

enum SetSlippageSteps {
  ENTER,
  SET_SLIPPAGE,
}

@Wizard(SceneEnum.SET_SLIPPAGE_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetSlippageScene extends BaseScene {
  @Inject()
  private readonly preferenceRepository: PreferenceRepository;
  @Inject()
  private readonly tokenService: TokenService;

  @WizardStep(SetSlippageSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context) {
    const message = await ctx.reply(SET_SLIPPAGE_TEXT, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: buildCancelKeyboard() },
    });
    this.addSceneMessage(ctx, message);
    ctx.wizard.next();
  }

  @On('text')
  @WizardStep(SetSlippageSteps.SET_SLIPPAGE)
  async setSlippage(@Ctx() ctx: Context, @Message() msg: TgMessage.TextMessage) {
    const { from } = ctx;
    const { fromMsg } = ctx.wizard.state as { fromMsg: TgMessage.TextMessage | undefined };
    if (!from || !fromMsg) return this.showUnexpectedError(ctx);

    this.addSceneMessage(ctx, msg);
    const messageText = msg.text;

    if (!isInputAmount(messageText)) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    await this.preferenceRepository.setSlippage(from.id, Number(messageText));
    await this.tokenService.refreshTokenInfoScreen(fromMsg, from);
    return ctx.scene.leave();
  }
}
