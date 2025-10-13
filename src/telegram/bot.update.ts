import { Command, Ctx, Message, On, Start, Update } from 'nestjs-telegraf';
import { Context } from './interfaces/context.interface';
import { BotService } from './bot.service';
import {
  Update as TgUpdate,
  Message as TgMessage,
  CallbackQuery as TgCallbackQuery,
} from 'telegraf/typings/core/types/typegram';
import { CtxUser } from './decorator/context-user.decorator';
import { ProcessCallbackQueryUseCase } from './use-cases/process-callback-query.use-case';
import { ProcessMessageTextUseCase } from './use-cases/process-message-text.use-case';
import { SET_MAIN_WALLET_SCENE, WALLET_SETTINGS_SCENE } from './constants/scene';
import { User } from '@telegraf/types';

@Update()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly processCallbackQueryUseCase: ProcessCallbackQueryUseCase,
    private readonly processMessageTextUseCase: ProcessMessageTextUseCase,
  ) {}

  @Start()
  onStart(@Ctx() ctx: Context) {
    return this.botService.start(ctx);
  }

  @Command('setmycommands')
  async onSetCommands() {
    return this.botService.setMyCommands();
  }

  @Command('setmainwallet')
  async onSetMainWallet(@Ctx() ctx: Context) {
    await ctx.scene.enter(SET_MAIN_WALLET_SCENE);
  }

  @Command('wallet')
  async onSetupWallet(@Ctx() ctx: Context) {
    await ctx.scene.enter(WALLET_SETTINGS_SCENE);
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
