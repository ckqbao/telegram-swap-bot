import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { WelcomeScreen } from './screens/welcome.screen';
import { Context } from './interfaces/context.interface';

@Injectable()
export class BotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly welcomeScreen: WelcomeScreen,
  ) {}

  async start(ctx: Context) {
    const { msg } = ctx;
    void this.bot.telegram.deleteMessage(msg.chat.id, msg.message_id);
    const caption = this.welcomeScreen.buildCaption();
    await this.bot.telegram.sendMessage(msg.chat.id, caption, {
      parse_mode: 'HTML',
    });
  }

  async setMyCommands() {
    await this.bot.telegram.setMyCommands([{ command: 'wallet', description: 'Setup wallets' }]);
  }
}
