import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { WelcomeScreen } from './screens/welcome.screen';
import { Context } from './interfaces/context.interface';
import { WalletsScreen } from './screens';
import { buildCloseKeyboard } from './utils/inline-keyboard';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly walletsScreen: WalletsScreen,
    private readonly welcomeScreen: WelcomeScreen,
  ) {}

  async start(ctx: Context) {
    const { msg } = ctx;
    const caption = this.welcomeScreen.buildCaption();
    await this.bot.telegram.sendMessage(msg.chat.id, caption, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buildCloseKeyboard(),
      },
    });
  }

  async setMyCommands() {
    await this.bot.telegram.setMyCommands([
      { command: 'start', description: 'Welcome to the bot' },
      { command: 'deletewallet', description: 'Delete wallet' },
      { command: 'setmainwallet', description: 'Set main wallet' },
      { command: 'wallet', description: 'Setup wallets' },
      { command: 'wallets', description: 'List all wallets' },
    ]);
  }

  async getWallets(ctx: Context, userId: number) {
    const caption = await this.walletsScreen.buildCaption(userId);
    await this.bot.telegram.sendMessage(ctx.msg.chat.id, caption, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: buildCloseKeyboard(),
      },
    });
  }

  async deleteCommandMessage(ctx: Context) {
    await this.bot.telegram.deleteMessage(ctx.msg.chat.id, ctx.msg.message_id);
  }
}
