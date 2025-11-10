import { Inject, UseFilters } from '@nestjs/common';
import { Action, Ctx, Next, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { SceneEnum } from '@/telegram/enums/scene.enum';
import { TelegrafExceptionFilter } from '@/telegram/filters/telegraf-exception.filter';
import { Context } from '@/telegram/interfaces/context.interface';
import { replyWithDataQueryRepliedMessage, replyWithInlineKeyboardMenu } from '@/telegram/utils/message';
import { tokenSettingsKeyboard } from '@/telegram/keyboards/token.keyboards';
import { tokenButtons } from '@/telegram/buttons/token.buttons';
import { CtxTextMessage } from '@/telegram/decorator/context-text-message.decorator';
import { CallbackQuery, Message } from 'telegraf/typings/core/types/typegram';
import z from 'zod';
import { trim } from 'lodash';
import { closeKeyboard } from '@/telegram/keyboards/common.keyboard';
import { PreferenceRepository } from '@/database/repository';
import { CtxUser } from '@/telegram/decorator/context-user.decorator';
import { User } from '@telegraf/types';
import { commonButtons } from '@/telegram/buttons/common.buttons';
import { isAddress } from 'viem';
import { setBuyAmountsCaption } from '@/telegram/captions/token.caption';
import { CtxDataQuery } from '@/telegram/decorator/context-data-query.decorator';
import { BaseScene } from '../base.scene';

@Scene(SceneEnum.TOKEN_SETTINGS_SCENE)
@UseFilters(TelegrafExceptionFilter)
export class TokenSettingsScene extends BaseScene {
  @Inject()
  private readonly preferenceRepository: PreferenceRepository;

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context) {
    await replyWithInlineKeyboardMenu(ctx, '⚙️ Token Settings', tokenSettingsKeyboard());
  }

  @Action(commonButtons.back.callback)
  async back(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.MAIN_SCENE);
  }

  @Action(commonButtons.close.callback)
  async close(@Next() next: () => Promise<void>) {
    return next();
  }

  @Action(tokenButtons.buyAmounts.callback)
  async enterBuyAmountsScene(@Ctx() ctx: Context, @CtxDataQuery() dataQuery: CallbackQuery.DataQuery) {
    const msg = await replyWithDataQueryRepliedMessage(
      ctx,
      tokenButtons.buyAmounts.callback,
      setBuyAmountsCaption(),
      dataQuery.message?.message_id,
    );
    this.addSceneMessage(ctx, msg);
  }

  @On('text')
  async onText(
    @Ctx() ctx: Context,
    @CtxTextMessage() msg: Message.TextMessage,
    @CtxUser() user: User,
    @Next() next: () => Promise<void>,
  ) {
    if (msg.text.startsWith('/')) return next();

    if (!msg.reply_to_message) {
      if (isAddress(msg.text)) return next();
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    if (!ctx.session.dataQueryRepliedMessage) return;

    switch (ctx.session.dataQueryRepliedMessage.data) {
      case tokenButtons.buyAmounts.callback: {
        const amounts = z.coerce
          .number()
          .array()
          .catch([])
          .parse(
            msg.text
              .split(',')
              .map(trim)
              .filter((val) => !val.startsWith('0x')),
          );
        if (!amounts.length) {
          await ctx.deleteMessage(msg.message_id);
          const invalidInputMsg = await replyWithDataQueryRepliedMessage(
            ctx,
            tokenButtons.buyAmounts.callback,
            `⚠︎ Invalid input, try again\n\n${setBuyAmountsCaption()}`,
            ctx.session.dataQueryRepliedMessage.parentMsgId,
          );
          this.addSceneMessage(ctx, invalidInputMsg);
          return;
        }
        await ctx.deleteMessages([msg.message_id, msg.reply_to_message.message_id]);
        await this.preferenceRepository.setBuyAmounts(user.id, amounts);
        await ctx.reply('✅ Successfully Set Buy Amounts', { reply_markup: closeKeyboard().reply_markup });
        return;
      }
      default:
        return next();
    }
  }
}
