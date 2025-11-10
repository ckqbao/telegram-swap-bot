import { Inject, UseFilters } from '@nestjs/common';
import { User } from '@telegraf/types';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { Action, Ctx, Next, On, Scene, SceneEnter } from 'nestjs-telegraf';

import { BaseScene } from '../base.scene';
import { SceneEnum } from '../../enums/scene.enum';
import { TelegrafExceptionFilter } from '../../filters/telegraf-exception.filter';
import { Context } from '../../interfaces/context.interface';
import { WalletRepository } from '@/database/repository';
import { CtxUser } from '../../decorator/context-user.decorator';
import { replyWithInlineKeyboardMenu } from '@/telegram/utils/message';
import { deleteWalletKeyboard } from '@/telegram/keyboards/wallet-settings.keyboard';
import { commonButtons } from '@/telegram/buttons/common.buttons';
import { CtxDataQuery } from '@/telegram/decorator/context-data-query.decorator';
import { isAddress } from 'viem';

@Scene(SceneEnum.DELETE_WALLET_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class DeleteWalletScene extends BaseScene {
  @Inject()
  private readonly walletRepository: WalletRepository;

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context, @CtxUser() user: User) {
    const wallets = await this.walletRepository.getByUserId(user.id);
    await replyWithInlineKeyboardMenu(ctx, '⚙️ Delete Wallet', deleteWalletKeyboard(wallets));
  }

  @Action(commonButtons.back.callback)
  async back(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }

  @Action(commonButtons.close.callback)
  async close(@Next() next: () => Promise<void>) {
    return next();
  }

  @On('callback_query')
  async onDeleteWallet(
    @Ctx() ctx: Context,
    @CtxDataQuery() { data }: CallbackQuery.DataQuery,
    @CtxUser() user: User,
    @Next() next: () => Promise<void>,
  ) {
    if (!isAddress(data)) return next();
    await this.walletRepository.deleteByAddress(data, user.id);
    await ctx.scene.reenter();
  }
}
