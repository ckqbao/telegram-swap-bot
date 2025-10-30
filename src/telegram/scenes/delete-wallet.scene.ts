import { Inject, UseFilters } from '@nestjs/common';
import { User } from '@telegraf/types';
import { Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';
import { CallbackQuery, Update } from 'telegraf/typings/core/types/typegram';

import { BaseScene } from './base.scene';
import { SceneEnum } from '../enums/scene.enum';
import { TelegrafExceptionFilter } from '../filters/telegraf-exception.filter';
import { Context } from '../interfaces/context.interface';
import { WalletRepository } from '@/database/repository';
import { Markup } from 'telegraf';
import { CtxUser } from '../decorator/context-user.decorator';
import { buildCloseKeyboard } from '../utils/inline-keyboard';
import { Command } from '../constants/command';

enum DeleteWalletSteps {
  ENTER,
  DELETE_WALLET,
}

@Wizard(SceneEnum.DELETE_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class DeleteWalletScene extends BaseScene {
  @Inject()
  private readonly walletRepository: WalletRepository;

  @WizardStep(DeleteWalletSteps.ENTER)
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
      '🔒 Delete Wallet',
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
  @WizardStep(DeleteWalletSteps.DELETE_WALLET)
  async onDeleteWallet(
    @Ctx() ctx: Context & { update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> },
    @CtxUser() user: User,
  ) {
    const { data } = ctx.update.callback_query;

    if (data === Command.CANCEL) {
      return this.abortScene(ctx);
    }

    const address = data;
    await this.walletRepository.deleteByAddress(data, user.id);
    await ctx.scene.leave();
    await ctx.reply(`Wallet ${address} has been deleted successfully.`, {
      reply_markup: { inline_keyboard: buildCloseKeyboard() },
    });
  }
}
