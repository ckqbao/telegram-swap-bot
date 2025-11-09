import { Inject } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { walletButtons } from '../buttons/wallet.buttons';
import { SceneEnum } from '../enums/scene.enum';
import { Context } from '../interfaces/context.interface';
import { mainKeyboard } from '../keyboards/main.keyboard';
import { WelcomeScreen } from '../screens';
import { replyWithTrack } from '../utils/message';

@Scene(SceneEnum.MAIN_SCENE)
export class MainScene {
  @Inject()
  private readonly welcomeScreen: WelcomeScreen;

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    const caption = this.welcomeScreen.buildCaption();
    await replyWithTrack(ctx, caption, mainKeyboard());
  }

  @Action(walletButtons.wallets.callback)
  async enterWalletsScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }
}
