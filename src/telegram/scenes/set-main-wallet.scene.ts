import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';

import { WalletRepository } from '@/database/repository';

import { BaseScene } from './base.scene';
import { SET_MAIN_WALLET_SCENE } from '../constants/scene';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { buildCloseKeyboard } from '../utils/inline-keyboard';
import { cleanScene } from '../utils/scene';
import { Context } from '../interfaces/context.interface';
import { Command } from '../constants/command';

@Wizard(SET_MAIN_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetMainWalletScene extends BaseScene {
  @Inject()
  private walletRepository: WalletRepository;

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: Context) {
    if (!ctx.from) {
      return this.showUnexpectedError(ctx);
    }

    const wallets = await this.walletRepository.getByUserId(ctx.from.id);
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
  @WizardStep(2)
  async onWalletName(@Ctx() ctx: Context & { update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> }) {
    const { data } = ctx.update.callback_query;

    if (!ctx.from || !data) {
      return this.showUnexpectedError(ctx);
    }

    if (data === Command.CANCEL) {
      return this.abortScene(ctx);
    }

    const wallet = await this.walletRepository.getByAddress(data);
    await this.walletRepository.setMainWallet(wallet._id);
    await cleanScene(ctx);
    await ctx.reply('Main wallet set successfully.', {
      reply_markup: { inline_keyboard: buildCloseKeyboard() },
    });
    return ctx.scene.leave();
  }
}
