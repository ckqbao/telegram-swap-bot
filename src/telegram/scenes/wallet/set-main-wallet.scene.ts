import { Inject, UseFilters } from '@nestjs/common';
import { User } from '@telegraf/types';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { Action, Ctx, Next, On, Wizard, WizardStep } from 'nestjs-telegraf';

import { WalletRepository } from '@/database/repository';
import { SceneEnum } from '@/telegram/enums/scene.enum';
import { TelegrafExceptionFilter } from '@/telegram/filters/telegraf-exception.filter';
import { Context } from '@/telegram/interfaces/context.interface';
import { CtxUser } from '@/telegram/decorator/context-user.decorator';
import { replyWithInlineKeyboardMenu } from '@/telegram/utils/message';
import { setMainWalletKeyboard } from '@/telegram/keyboards/wallet-settings.keyboard';
import { commonButtons } from '@/telegram/buttons/common.buttons';
import { CtxDataQuery } from '@/telegram/decorator/context-data-query.decorator';

enum SetMainWalletSteps {
  ENTER,
  SET_MAIN_WALLET,
}

@Wizard(SceneEnum.SET_MAIN_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetMainWalletScene {
  @Inject()
  private walletRepository: WalletRepository;

  @Action(commonButtons.back.callback)
  async back(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }

  @Action(commonButtons.close.callback)
  async close(@Next() next: () => Promise<void>) {
    return next();
  }

  @WizardStep(SetMainWalletSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context, @CtxUser() user: User) {
    const wallets = await this.walletRepository.getByUserId(user.id);
    await replyWithInlineKeyboardMenu(ctx, '⚙️ Set main wallet', setMainWalletKeyboard(wallets));
    ctx.wizard.next();
  }

  @WizardStep(SetMainWalletSteps.SET_MAIN_WALLET)
  @On('callback_query')
  async onSetMainWallet(@Ctx() ctx: Context, @CtxDataQuery() { data }: CallbackQuery.DataQuery, @CtxUser() user: User) {
    const wallet = await this.walletRepository.getByAddress(data, user.id);
    if (wallet.isMain) return;
    await this.walletRepository.setMainWallet(wallet._id, user.id);
    await ctx.scene.reenter();
  }
}
