import { Inject, UseFilters } from '@nestjs/common';
import { User } from '@telegraf/types';
import { Action, Ctx, On, Wizard, WizardStep } from 'nestjs-telegraf';

import { WalletRepository } from '@/database/repository';
import { SceneEnum } from '@/telegram/enums/scene.enum';
import { TelegrafExceptionFilter } from '@/telegram/filters/telegraf-exception.filter';
import { Context } from '@/telegram/interfaces/context.interface';
import { CtxUser } from '@/telegram/decorator/context-user.decorator';
import { replyWithTrack } from '@/telegram/utils/message';
import { setMainWalletKeyboard } from '@/telegram/keyboards/wallet-settings.keyboard';
import { commonButtons } from '@/telegram/buttons/common.buttons';
import { CallbackQueryData } from '@/telegram/decorator/callback-query-data.decorator';

enum SetMainWalletSteps {
  ENTER,
  SET_MAIN_WALLET,
}

@Wizard(SceneEnum.SET_MAIN_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class SetMainWalletScene {
  @Inject()
  private walletRepository: WalletRepository;

  @WizardStep(SetMainWalletSteps.ENTER)
  async onSceneEnter(@Ctx() ctx: Context, @CtxUser() user: User) {
    const wallets = await this.walletRepository.getByUserId(user.id);
    await replyWithTrack(ctx, '⚙️ Set main wallet', setMainWalletKeyboard(wallets));
    ctx.wizard.next();
  }

  @On('callback_query')
  @WizardStep(SetMainWalletSteps.SET_MAIN_WALLET)
  async onSetMainWallet(@Ctx() ctx: Context, @CallbackQueryData() data: string, @CtxUser() user: User) {
    const wallet = await this.walletRepository.getByAddress(data, user.id);
    if (wallet.isMain) return;
    await this.walletRepository.setMainWallet(wallet._id, user.id);
    await ctx.scene.reenter();
  }

  @Action(commonButtons.back.callback)
  async back(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }

  @Action(commonButtons.close.callback)
  async close(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
  }
}
