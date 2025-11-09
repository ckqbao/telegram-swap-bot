import { User } from '@telegraf/types';
import { Action, Command, Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import { Message as TgMessage } from 'telegraf/typings/core/types/typegram';
import { CtxUser } from './decorator/context-user.decorator';
import { Context } from './interfaces/context.interface';
import { ProcessMessageTextUseCase } from './use-cases/process-message-text.use-case';
import { commonButtons } from './buttons/common.buttons';
import { BotCommandEnum } from './enums/bot-command.enum';
import { BotCommandService } from './bot-command.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly botCommandService: BotCommandService,
    private readonly processMessageTextUseCase: ProcessMessageTextUseCase,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botCommandService.start(ctx);
  }

  @Command(BotCommandEnum.SET_MY_COMMANDS)
  async onSetCommands(@Ctx() ctx: Context, @CtxUser() user: User) {
    await this.botCommandService.setMyCommands(ctx, user.id);
  }

  @Command(BotCommandEnum.WALLETS)
  async onGetWallets(@Ctx() ctx: Context) {
    await this.botCommandService.wallets(ctx);
  }

  @On('text')
  onMessageText(@Message() msg: TgMessage.TextMessage, @CtxUser() user: User) {
    return this.processMessageTextUseCase.execute(msg, user);
  }

  // @On('callback_query')
  // onCallbackQuery(
  //   @Ctx()
  //   ctx: Context & { update: TgUpdate.CallbackQueryUpdate<TgCallbackQuery.DataQuery> },
  //   @CtxUser() user: User,
  // ) {
  //   return this.processCallbackQueryUseCase.execute(ctx, user);
  // }

  @Action(commonButtons.close.callback)
  async deleteMessage(@Ctx() ctx: Context) {
    console.log('🚀 ~ BotUpdate ~ deleteMessage ~ ctx:', ctx.update);
    await ctx.deleteMessage();
  }
}
