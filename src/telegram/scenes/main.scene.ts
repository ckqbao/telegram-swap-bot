import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { SceneEnum } from '../enums/scene.enum';
import { Context } from '../interfaces/context.interface';
import { Inject } from '@nestjs/common';
import { WelcomeScreen } from '../screens';
import { mainKeyboard } from '../keyboards/main.keyboard';
import { walletButtons } from '../buttons/wallet.buttons';

@Scene(SceneEnum.MAIN_SCENE)
export class MainScene {
  @Inject()
  private readonly welcomeScreen: WelcomeScreen;

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    const caption = this.welcomeScreen.buildCaption();
    await ctx.replyWithHTML(caption, mainKeyboard());
    // @ts-ignore
    ctx.session.__scenes = { ...ctx.session.__scenes, state: { messageId: ctx.message?.message_id } };
    console.log('🚀 ~ MainScene ~ onSceneEnter ~ ctx:', ctx.session);
    return;
  }

  @Action(walletButtons.wallets.callback)
  async enterWalletsScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }
}
