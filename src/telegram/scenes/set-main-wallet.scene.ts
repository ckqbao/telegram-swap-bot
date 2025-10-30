import { Inject, UseFilters } from '@nestjs/common';
import { User } from '@telegraf/types';
import { Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';

import { WalletRepository } from '@/database/repository';

import { BaseScene } from './base.scene';
import { Command } from '../constants/command';
import { SceneEnum } from '../enums/scene.enum';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { Context } from '../interfaces/context.interface';
import { buildCloseKeyboard } from '../utils/inline-keyboard';
import { CtxUser } from '../decorator/context-user.decorator';

enum SetMainWalletSteps {
  ENTER,
  SET_MAIN_WALLET,
}

@Wizard(SceneEnum.SET_MAIN_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetMainWalletScene extends BaseScene {
  @Inject()
  private walletRepository: WalletRepository;

  @WizardStep(SetMainWalletSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context, @CtxUser() user: User) {
    const wallets = await this.walletRepository.getByUserId(user.id);

    if (!wallets.length) {
      await ctx.reply('You have no wallets', {
        reply_markup: {
          inline_keyboard: buildCloseKeyboard(),
        },
      });
      return ctx.scene.leave();
    }

    const message = await ctx.reply(
      '⚙️ Set main wallet',
      Markup.inlineKeyboard(
        [
          ...wallets.map(({ address, name }) => Markup.button.callback(name, address)),
          Markup.button.callback('❌ Cancel', Command.CANCEL),
        ],
        { columns: 1 },
      ),
    );
    this.addMessageToState(ctx, message);
    ctx.wizard.next();
  }

  @On('callback_query')
  @WizardStep(SetMainWalletSteps.SET_MAIN_WALLET)
  async onSetMainWallet(
    @Ctx() ctx: Context & { update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> },
    @CtxUser() user: User,
  ) {
    const { data } = ctx.update.callback_query;

    if (data === Command.CANCEL) {
      return this.abortScene(ctx);
    }

    const wallet = await this.walletRepository.getByAddress(data, user.id);
    await this.walletRepository.setMainWallet(wallet._id, user.id);
    await ctx.scene.leave();
    await ctx.reply('Main wallet set successfully.', {
      reply_markup: { inline_keyboard: buildCloseKeyboard() },
    });
  }
}
