import { UseInterceptors } from '@nestjs/common';
import { User } from '@telegraf/types';
import { Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import {
  Update as TgUpdate,
  Message as TgMessage,
  CallbackQuery as TgCallbackQuery,
} from 'telegraf/typings/core/types/typegram';
import { BotService } from './bot.service';
import { Command } from './decorator/command.decorator';
import { CtxUser } from './decorator/context-user.decorator';
import { BotCommandEnum } from './enums/bot-command.enum';
import { SceneEnum } from './enums/scene.enum';
import { Context } from './interfaces/context.interface';
import { BotCommandInterceptor } from './interceptors/bot-command.interceptor';
import { ProcessCallbackQueryUseCase } from './use-cases/process-callback-query.use-case';
import { ProcessMessageTextUseCase } from './use-cases/process-message-text.use-case';

@Update()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly processCallbackQueryUseCase: ProcessCallbackQueryUseCase,
    private readonly processMessageTextUseCase: ProcessMessageTextUseCase,
  ) {}

  @Start()
  @UseInterceptors(BotCommandInterceptor)
  async onStart(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }

  @Command(BotCommandEnum.DELETE_WALLET)
  @UseInterceptors(BotCommandInterceptor)
  async onDeleteWallet(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.DELETE_WALLET_SCENE);
  }

  @Command(BotCommandEnum.SET_MY_COMMANDS)
  @UseInterceptors(BotCommandInterceptor)
  async onSetCommands() {
    await this.botService.setMyCommands();
  }

  @Command(BotCommandEnum.SET_MAIN_WALLET)
  @UseInterceptors(BotCommandInterceptor)
  async onSetMainWallet(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.SET_MAIN_WALLET_SCENE);
  }

  @Command(BotCommandEnum.WALLET)
  @UseInterceptors(BotCommandInterceptor)
  async onSetupWallet(@Ctx() ctx: Context) {
    await ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE);
  }

  @Command(BotCommandEnum.WALLETS)
  @UseInterceptors(BotCommandInterceptor)
  async onGetWallets(@Ctx() ctx: Context, @CtxUser() user: User) {
    await this.botService.getWallets(ctx, user.id);
  }

  @On('text')
  onMessageText(@Message() msg: TgMessage.TextMessage, @CtxUser() user: User) {
    return this.processMessageTextUseCase.execute(msg, user);
  }

  @On('callback_query')
  onCallbackQuery(
    @Ctx()
    ctx: Context & { update: TgUpdate.CallbackQueryUpdate<TgCallbackQuery.DataQuery> },
    @CtxUser() user: User,
  ) {
    return this.processCallbackQueryUseCase.execute(ctx, user);
  }
}
