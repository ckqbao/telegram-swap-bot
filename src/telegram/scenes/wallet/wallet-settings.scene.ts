import { UseFilters } from '@nestjs/common';
import { Action, Ctx, Next, Scene, SceneEnter } from 'nestjs-telegraf';

import { SceneEnum } from '@/telegram/enums/scene.enum';
import { TelegrafExceptionFilter } from '@/telegram/filters/telegraf-exception.filter';
import { Context } from '@/telegram/interfaces/context.interface';
import { walletSettingsKeyboard } from '@/telegram/keyboards/wallet-settings.keyboard';
import { commonButtons } from '@/telegram/buttons/common.buttons';
import { walletButtons } from '@/telegram/buttons/wallet.buttons';
import { replyWithInlineKeyboardMenu } from '@/telegram/utils/message';

@Scene(SceneEnum.WALLET_SETTINGS_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class WalletSettingsScene {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    await replyWithInlineKeyboardMenu(ctx, '⚙️ Wallet Setup', walletSettingsKeyboard());
  }

  @Action(walletButtons.setupWallet.callback)
  async enterSetupWalletScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.SETUP_WALLET_SCENE);
  }

  @Action(walletButtons.setMainWallet.callback)
  async enterSetMainWalletScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.SET_MAIN_WALLET_SCENE);
  }

  @Action(walletButtons.deleteWallet.callback)
  async enterDeleteWalletScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.DELETE_WALLET_SCENE);
  }

  @Action(commonButtons.back.callback)
  async backtoMainScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.MAIN_SCENE);
  }

  @Action(commonButtons.close.callback)
  async close(@Next() next: () => Promise<void>) {
    return next();
  }
}
