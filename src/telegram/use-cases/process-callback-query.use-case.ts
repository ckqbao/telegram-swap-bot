import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CallbackQuery, MaybeInaccessibleMessage, Update } from 'telegraf/typings/core/types/typegram';
import { User } from '@telegraf/types';
import { MsgLogRepository, WalletRepository } from '@/database/repository';
import { Command } from '../constants/command';
import { Context } from '../interfaces/context.interface';
import { TOKEN_ADDRESS } from '@/common/constants';
import { OneInchTokenService } from '@/1inch/1inch-token.service';
import { isAddress } from 'viem';
import { OneInchBalanceService } from '@/1inch/1inch-balance.service';
import { BalanceScreen } from '../screens/balance.screen';
import { BUYTOKEN_CUSTOM_SCENE, SELLTOKEN_CUSTOM_SCENE, SET_SLIPPAGE_SCENE } from '../constants/scene';
import { SwapService } from '../swap.service';
import { TokenService } from '../token.service';
import { cleanScene } from '../utils/scene';
import { callbackButtonDataSchema } from '../types/callback-button-data';

@Injectable()
export class ProcessCallbackQueryUseCase {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly walletRepository: WalletRepository,
    private readonly balanceScreen: BalanceScreen,
    private readonly oneInchBalanceService: OneInchBalanceService,
    private readonly oneInchTokenService: OneInchTokenService,
    private readonly swapService: SwapService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(ctx: Context & { update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> }, user: User) {
    const { data, message } = ctx.update.callback_query;

    if (!data || !message) return;

    const { command } = callbackButtonDataSchema.parse(JSON.parse(data));

    if (!command) return;

    switch (command) {
      case Command.BALANCE:
        await this.getBalance(message, user);
        return;
      case Command['BUYTOKEN_0.05']:
      case Command['BUYTOKEN_0.06']:
      case Command['BUYTOKEN_0.08']:
      case Command['BUYTOKEN_0.1']:
      case Command['BUYTOKEN_0.11']:
      case Command['BUYTOKEN_0.12']:
      case Command['BUYTOKEN_0.15']:
      case Command['BUYTOKEN_0.25']: {
        const amount = command.split('_')[1];
        await this.swapService.buyToken(message, amount, user.id);
        return;
      }
      case Command.BUYTOKEN_CUSTOM:
        await ctx.scene.enter(BUYTOKEN_CUSTOM_SCENE, { fromMsg: message });
        break;
      case Command.CANCEL:
        await this.cleanAndLeaveScene(ctx);
        return;
      case Command.DISMISS_MESSAGE:
        await this.dismissMessage(message.chat.id, message.message_id);
        await this.cleanAndLeaveScene(ctx);
        return;
      case Command.REFRESH:
        await this.tokenService.refreshTokenInfoScreen(message, user);
        return;
      case Command.SELLTOKEN_50:
      case Command.SELLTOKEN_100: {
        const percent = Number(command.split('_')[1]);
        await this.swapService.sellToken(message, percent, user.id);
        return;
      }
      case Command.SELLTOKEN_X:
        await ctx.scene.enter(SELLTOKEN_CUSTOM_SCENE, { fromMsg: message });
        return;
      case Command.SLIPPAGE:
        await ctx.scene.enter(SET_SLIPPAGE_SCENE, { fromMsg: message });
        return;
    }
  }

  private async cleanAndLeaveScene(ctx: Context) {
    if (!ctx.scene) return;
    await cleanScene(ctx);
    return ctx.scene.leave();
  }

  private async getBalance(msg: MaybeInaccessibleMessage, user: User) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      chatId: msg.chat.id,
      username: user.username,
    });
    if (!msgLog || !isAddress(msgLog.tokenAddress)) return;

    const { tokenAddress } = msgLog;
    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(user.id);
    const tokens = [tokenAddress, TOKEN_ADDRESS.BNB, TOKEN_ADDRESS.WBNB, TOKEN_ADDRESS.USDT];
    const [tokenBalances, tokenInfos] = await Promise.all([
      this.oneInchBalanceService.getTokenBalances(tokens, privateKey),
      this.oneInchTokenService.getTokensInfo(tokens),
    ]);
    const caption = this.balanceScreen.buildCaption(tokenBalances, tokenInfos);
    const inlineKeyboard = this.balanceScreen.buildInlineKeyboard();
    await this.bot.telegram.sendMessage(msg.chat.id, caption, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });
  }

  private async dismissMessage(chatId: number, msgId: number) {
    await this.bot.telegram.deleteMessage(chatId, msgId);
  }
}
