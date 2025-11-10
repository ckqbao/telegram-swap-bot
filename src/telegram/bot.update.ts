import { User } from '@telegraf/types';
import { Action, Command, Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import { CallbackQuery, Message as TgMessage } from 'telegraf/typings/core/types/typegram';
import { CtxUser } from './decorator/context-user.decorator';
import { Context } from './interfaces/context.interface';
import { ProcessTextUseCase } from './use-cases/process-text.use-case';
import { commonButtons } from './buttons/common.buttons';
import { BotCommandEnum } from './enums/bot-command.enum';
import { BotCommandService } from './bot-command.service';
import { ProcessCallbackQueryUseCase } from './use-cases/process-callback-query.use-case';
import { CtxDataQuery } from './decorator/context-data-query.decorator';
import { ProcessReplyMessageUseCase } from './use-cases/process-reply-message.use-case';

@Update()
export class BotUpdate {
  constructor(
    private readonly botCommandService: BotCommandService,
    private readonly processCallbackQueryUseCase: ProcessCallbackQueryUseCase,
    private readonly processReplyMessageUseCase: ProcessReplyMessageUseCase,
    private readonly processTextUseCase: ProcessTextUseCase,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botCommandService.start(ctx);
  }

  @Command(BotCommandEnum.SET_MY_COMMANDS)
  async onSetCommands(@Ctx() ctx: Context, @CtxUser() user: User) {
    await this.botCommandService.setMyCommands(ctx, user.id);
  }

  @Command(BotCommandEnum.TOKEN_SETTINGS)
  async onBuyAmounts(@Ctx() ctx: Context) {
    await this.botCommandService.tokenSettings(ctx);
  }

  @Command(BotCommandEnum.WALLET_SETTINGS)
  async onGetWallets(@Ctx() ctx: Context) {
    await this.botCommandService.walletSettings(ctx);
  }

  @Action(commonButtons.close.callback)
  async deleteMessage(@Ctx() ctx: Context, @CtxDataQuery() { message }: CallbackQuery.DataQuery) {
    await ctx.deleteMessage(message?.message_id);
    await ctx.scene.leave();
  }

  @On('text')
  onMessageText(@Ctx() ctx: Context, @Message() msg: TgMessage.TextMessage, @CtxUser() user: User) {
    if (msg.reply_to_message) {
      return this.processReplyMessageUseCase.execute(ctx, msg, user);
    }
    return this.processTextUseCase.execute(ctx, msg, user);
  }

  @On('callback_query')
  onCallbackQuery(
    @Ctx()
    ctx: Context,
    @CtxDataQuery() dataQuery: CallbackQuery.DataQuery,
    @CtxUser() user: User,
  ) {
    return this.processCallbackQueryUseCase.execute(ctx, dataQuery, user);
  }
}
