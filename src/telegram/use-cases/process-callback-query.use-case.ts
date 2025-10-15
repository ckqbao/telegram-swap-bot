import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { z } from 'zod';
import { CallbackQuery, MaybeInaccessibleMessage, Update } from 'telegraf/typings/core/types/typegram';
import { User } from '@telegraf/types';
import { MsgLogRepository, PreferenceRepository, WalletRepository } from '@/database/repository';
import { Command } from '../constants/command';
import { Context } from '../interfaces/context.interface';
import { TokenInfoScreen } from '../screens/token-info.screen';
import { TOKEN_ADDRESS } from '@/common/constants';
import { OneInchTokenService } from '@/1inch/1inch-token.service';
import { OneInchSpotPriceService } from '@/1inch/1inch-spot-price.service';
import { isAddress } from 'viem';
import { OneInchTokenDetailsService } from '@/1inch/1inch-token-details.service';
import { OneInchBalanceService } from '@/1inch/1inch-balance.service';
import { BalanceScreen } from '../screens/balance.screen';
import { BUYTOKEN_CUSTOM_SCENE } from '../constants/scene';
import { SwapService } from '../swap.service';

@Injectable()
export class ProcessCallbackQueryUseCase {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly walletRepository: WalletRepository,
    private readonly balanceScreen: BalanceScreen,
    private readonly tokenInfoScreen: TokenInfoScreen,
    private readonly oneInchSpotPriceService: OneInchSpotPriceService,
    private readonly oneInchBalanceService: OneInchBalanceService,
    private readonly oneInchTokenDetailsService: OneInchTokenDetailsService,
    private readonly oneInchTokenService: OneInchTokenService,
    private readonly swapService: SwapService,
  ) {}

  async execute(ctx: Context & { update: Update.CallbackQueryUpdate<CallbackQuery.DataQuery> }, user: User) {
    const { data, message } = ctx.update.callback_query;

    if (!data || !message) return;

    const { command } = z
      .object({ command: z.enum(Object.values(Command)) })
      .catch({ command: Command.DUMMY })
      .parse(JSON.parse(data));

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
        const amount = Number(command.split('_')[1]);
        await this.swapService.buyToken(message, amount, user.id);
        return;
      }
      case Command.BUYTOKEN_CUSTOM:
        await ctx.scene.enter(BUYTOKEN_CUSTOM_SCENE, { fromMsg: message });
        break;
      case Command.DISMISS_MESSAGE:
        await this.dismissMessage(message.chat.id, message.message_id);
        return;
      case Command.REFRESH:
        await this.refresh(message, user);
        return;
      case Command.SELLTOKEN_50:
      case Command.SELLTOKEN_100: {
        const percent = Number(command.split('_')[1]);
        await this.swapService.sellToken(message, percent, user.id);
        return;
      }
      case Command.SELLTOKEN_X:
        return;
    }
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

  private async refresh(msg: MaybeInaccessibleMessage, user: User) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      chatId: msg.chat.id,
      username: user.username,
    });

    if (!msgLog || !isAddress(msgLog.tokenAddress)) return;

    const { tokenAddress } = msgLog;
    const [tokenInfo, price, marketCap] = await Promise.all([
      this.oneInchTokenService.getTokenInfo(tokenAddress),
      this.oneInchSpotPriceService.getTokenPrice(tokenAddress),
      this.oneInchTokenDetailsService.getTokenMarketCap(tokenAddress),
    ]);
    const preference = await this.preferenceRepository.getByUserId(user.id);
    const caption = this.tokenInfoScreen.buildCaption(tokenInfo.name, tokenInfo.symbol, tokenAddress, price, marketCap);
    await this.bot.telegram.editMessageText(msg.chat.id, msgLog.msgId, undefined, caption, {
      link_preview_options: {
        is_disabled: true,
      },
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: this.tokenInfoScreen.buildInlineKeyboard({
          buyGas: preference.buyGas,
          sellGas: preference.sellGas,
          slippage: preference.slippage,
        }),
      },
    });
  }
}
