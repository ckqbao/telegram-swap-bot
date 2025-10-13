import { Inject, UseFilters } from '@nestjs/common';
import { Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';
import { WizardContext } from 'telegraf/typings/scenes';

import { WalletRepository } from '@/database/repository';

import { BaseScene } from './base.scene';
import { SET_MAIN_WALLET_SCENE } from '../constants/scene';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { Command } from '../constants/command';

@Wizard(SET_MAIN_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetMainWalletScene extends BaseScene {
  @Inject()
  private walletRepository: WalletRepository;

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext) {
    if (!ctx.from) {
      return this.showUnexpectedError(ctx);
    }

    const wallets = await this.walletRepository.getByUserId(ctx.from.id);
    if (!wallets.length) {
      await ctx.scene.leave();
      return 'You have no wallets';
    }

    await ctx.reply(
      '⚙️ Set main wallet',
      Markup.inlineKeyboard(
        [
          ...wallets.map(({ address, name }) => Markup.button.callback(name, address)),
          Markup.button.callback('Cancel', Command.CANCEL),
        ],
        { columns: 1 },
      ),
    );
    ctx.wizard.next();
  }

  @On('callback_query')
  @WizardStep(2)
  async onWalletName(@Ctx() ctx: WizardContext & { update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> }) {
    const { data } = ctx.update.callback_query;

    if (!ctx.from || !data) {
      return this.showUnexpectedError(ctx);
    }

    if (data === Command.CANCEL) {
      await ctx.scene.leave();
      return 'Cancelled.';
    }

    const wallet = await this.walletRepository.getByAddress(data);
    await this.walletRepository.setMainWallet(wallet._id);

    await ctx.scene.leave();
    return 'Main wallet set successfully.';
  }
}
