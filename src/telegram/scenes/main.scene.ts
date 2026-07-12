import { Action, Ctx, Next, Scene, SceneEnter } from 'nestjs-telegraf';
import { User } from '@telegraf/types';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { getChain, isChainKey } from '@/common/constants';
import { resolveChainKey } from '@/common/utils';
import { PreferenceRepository } from '@/database/repository';
import { chainButtons } from '../buttons/chain.buttons';
import { walletButtons } from '../buttons/wallet.buttons';
import { SceneEnum } from '../enums/scene.enum';
import { Context } from '../interfaces/context.interface';
import { chainSelectKeyboard, mainKeyboard } from '../keyboards/main.keyboard';
import { replyWithInlineKeyboardMenu } from '../utils/message';
import { commonButtons } from '../buttons/common.buttons';
import { tokenButtons } from '../buttons/token.buttons';
import { startCaption } from '../captions/bot-command.caption';
import { CtxDataQuery } from '../decorator/context-data-query.decorator';
import { CtxUser } from '../decorator/context-user.decorator';

@Scene(SceneEnum.MAIN_SCENE)
export class MainScene {
  constructor(private readonly preferenceRepository: PreferenceRepository) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context, @CtxUser() user: User) {
    const preference = await this.preferenceRepository.getByUserId(user.id);
    await replyWithInlineKeyboardMenu(ctx, startCaption(), mainKeyboard(resolveChainKey(preference)));
  }

  @Action(chainButtons.chainSelect.callback)
  async selectChain(@Ctx() ctx: Context, @CtxUser() user: User) {
    const preference = await this.preferenceRepository.getByUserId(user.id);
    await ctx.editMessageReplyMarkup(chainSelectKeyboard(resolveChainKey(preference)).reply_markup);
  }

  @Action(new RegExp(`^${chainButtons.setChainPrefix}\\w+$`))
  async setChain(@Ctx() ctx: Context, @CtxUser() user: User, @CtxDataQuery() dataQuery: CallbackQuery.DataQuery) {
    const chainKey = dataQuery.data.slice(chainButtons.setChainPrefix.length);
    if (!isChainKey(chainKey)) return;
    await this.preferenceRepository.setChain(user.id, chainKey);
    await ctx.editMessageReplyMarkup(mainKeyboard(chainKey).reply_markup);
    await ctx.answerCbQuery(`Chain set to ${getChain(chainKey).label}`);
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
