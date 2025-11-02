import { User } from '@telegraf/types';
import { Action, Command, Ctx, Hears, Message, On, Start, Update } from 'nestjs-telegraf';
import {
  Update as TgUpdate,
  Message as TgMessage,
  CallbackQuery as TgCallbackQuery,
} from 'telegraf/typings/core/types/typegram';
import { BotService } from './bot.service';
import { CtxUser } from './decorator/context-user.decorator';
import { BotCommandEnum } from './enums/bot-command.enum';
import { SceneEnum } from './enums/scene.enum';
import { Context } from './interfaces/context.interface';
import { ProcessCallbackQueryUseCase } from './use-cases/process-callback-query.use-case';
import { ProcessMessageTextUseCase } from './use-cases/process-message-text.use-case';
import { BotCommandService } from './services/bot-command.service';
import { commonButtons } from './buttons/common.buttons';

@Update()
export class BotUpdate {
  constructor(
    private readonly botService: BotService,
    private readonly botCommandService: BotCommandService,
    private readonly processCallbackQueryUseCase: ProcessCallbackQueryUseCase,
    private readonly processMessageTextUseCase: ProcessMessageTextUseCase,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botCommandService.process(ctx, () => ctx.scene.enter(SceneEnum.MAIN_SCENE));
  }

  @Command(BotCommandEnum.DELETE_WALLET)
  async onDeleteWallet(@Ctx() ctx: Context) {
    await this.botCommandService.process(ctx, () => ctx.scene.enter(SceneEnum.DELETE_WALLET_SCENE));
  }

  @Command(BotCommandEnum.SET_MY_COMMANDS)
  async onSetCommands() {
    await this.botService.setMyCommands();
  }

  @Command(BotCommandEnum.SET_MAIN_WALLET)
  async onSetMainWallet(@Ctx() ctx: Context) {
    await this.botCommandService.process(ctx, () => ctx.scene.enter(SceneEnum.SET_MAIN_WALLET_SCENE));
  }

  @Command(BotCommandEnum.WALLET)
  async onSetupWallet(@Ctx() ctx: Context) {
    await this.botCommandService.process(ctx, () => ctx.scene.enter(SceneEnum.WALLET_SETTINGS_SCENE));
  }

  @Command(BotCommandEnum.WALLETS)
  async onGetWallets(@Ctx() ctx: Context, @CtxUser() user: User) {
    await this.botCommandService.process(ctx, () => this.botService.getWallets(ctx, user.id));
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

  @Action(commonButtons.back.callback)
  async goMainScene(@Ctx() ctx: Context) {
    console.log('🚀 ~ BotUpdate ~ goMainScene ~ ctx:', ctx);
    await ctx.scene.enter(SceneEnum.MAIN_SCENE);
  }

  @Action(commonButtons.close.callback)
  async deleteMessage(@Ctx() ctx: Context) {
    await ctx.deleteMessage();
  }
}
