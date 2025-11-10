import { Action, Ctx, Next, Scene, SceneEnter } from 'nestjs-telegraf';
import { walletButtons } from '../buttons/wallet.buttons';
import { SceneEnum } from '../enums/scene.enum';
import { Context } from '../interfaces/context.interface';
import { mainKeyboard } from '../keyboards/main.keyboard';
import { replyWithInlineKeyboardMenu } from '../utils/message';
import { commonButtons } from '../buttons/common.buttons';
import { tokenButtons } from '../buttons/token.buttons';
import { startCaption } from '../captions/bot-command.caption';

@Scene(SceneEnum.MAIN_SCENE)
export class MainScene {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    await replyWithInlineKeyboardMenu(ctx, startCaption(), mainKeyboard());
  }

  @Action(tokenButtons.tokenSettings.callback)
  async enterTokenSettingsScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.TOKEN_SETTINGS_SCENE);
  }

  @Action(walletButtons.wallets.callback)
  async enterWalletsScene(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }

  @Action(commonButtons.close.callback)
  async close(@Next() next: () => Promise<void>) {
    return next();
  }
}
