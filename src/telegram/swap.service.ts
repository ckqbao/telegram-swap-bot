import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CallbackQuery, Message } from 'telegraf/typings/core/types/typegram';
import { formatUnits, parseUnits } from 'viem';
import { OneInchBalanceService } from '@/1inch/1inch-balance.service';
import { OneInchClassicSwapService } from '@/1inch/1inch-classic-swap.service';
import { NATIVE_TOKEN, TOKEN_ADDRESS, TOKEN_DECIMALS } from '@/common/constants';
import { MsgLogRepository, PreferenceRepository, WalletRepository } from '@/database/repository';
import { Context } from './interfaces/context.interface';
import { SwapScreen } from './screens/swap.screen';
import { OneInchTokenService } from '@/1inch/1inch-token.service';
import { buildCloseKeyboard } from './utils/inline-keyboard';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly walletRepository: WalletRepository,
    private readonly swapScreen: SwapScreen,
    private readonly oneInchBalanceService: OneInchBalanceService,
    private readonly oneInchClassicSwapService: OneInchClassicSwapService,
    private readonly oneInchTokenService: OneInchTokenService,
  ) {}

  async buyToken(msg: Exclude<CallbackQuery.DataQuery['message'], undefined>, amount: number, userId: number) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      msgId: msg.message_id,
    });
    if (!msgLog) return;
    const { tokenAddress } = msgLog;
    const preference = await this.preferenceRepository.getByUserId(userId);
    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(userId);
    try {
      const messages: Message.TextMessage[] = [];
      await this.oneInchClassicSwapService.performSwap(
        {
          privateKey,
          tokenAddress: TOKEN_ADDRESS[NATIVE_TOKEN],
          dstToken: tokenAddress,
          amountToSwap: parseUnits(`${amount}`, TOKEN_DECIMALS),
          slippage: preference.slippage,
        },
        async (status) => {
          await this.cleanMessages(msg.chat.id, messages);
          const statusCaption = this.swapScreen.buildStatusCaption(status);
          const message = await this.bot.telegram.sendMessage(msg.chat.id, statusCaption, { parse_mode: 'HTML' });
          messages.push(message);
        },
      );
      await this.cleanMessages(msg.chat.id, messages);
      const successCaption = this.swapScreen.buildCaption(amount, NATIVE_TOKEN, 'buy');
      await this.bot.telegram.sendMessage(msg.chat.id, successCaption, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buildCloseKeyboard() },
      });
    } catch (error) {
      this.logger.error('Failed to buy token', error);
      const failedCaption = this.swapScreen.buildFailedCaption(amount, NATIVE_TOKEN, 'buy');
      await this.bot.telegram.sendMessage(msg.chat.id, failedCaption, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buildCloseKeyboard() },
      });
    }
  }

  async sellToken(msg: Exclude<CallbackQuery.DataQuery['message'], undefined>, percent: number, userId: number) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      msgId: msg.message_id,
    });
    if (!msgLog) return;
    const { tokenAddress } = msgLog;
    const preference = await this.preferenceRepository.getByUserId(userId);
    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(userId);
    const [tokenInfo, tokenBalances] = await Promise.all([
      this.oneInchTokenService.getTokenInfo(tokenAddress),
      this.oneInchBalanceService.getTokenBalances([tokenAddress], privateKey),
    ]);
    const balance = Object.values(tokenBalances)[0];
    if (!balance) {
      await this.bot.telegram.sendMessage(msg.chat.id, 'No balance for this token to sell', {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buildCloseKeyboard() },
      });
      return;
    }

    const amount = Number(formatUnits(balance, tokenInfo.decimals)) * (percent / 100);
    try {
      const messages: Message.TextMessage[] = [];
      await this.oneInchClassicSwapService.performSwap(
        {
          privateKey,
          tokenAddress,
          dstToken: TOKEN_ADDRESS[NATIVE_TOKEN],
          amountToSwap: parseUnits(`${amount}`, tokenInfo.decimals),
          slippage: preference.slippage,
        },
        async (status) => {
          await this.cleanMessages(msg.chat.id, messages);
          const statusCaption = this.swapScreen.buildStatusCaption(status);
          const message = await this.bot.telegram.sendMessage(msg.chat.id, statusCaption, { parse_mode: 'HTML' });
          messages.push(message);
        },
      );
      await this.cleanMessages(msg.chat.id, messages);
      const successCaption = this.swapScreen.buildCaption(amount, tokenInfo.symbol, 'sell');
      await this.bot.telegram.sendMessage(msg.chat.id, successCaption, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buildCloseKeyboard() },
      });
    } catch (error) {
      this.logger.error('Failed to sell token', error);
      const failedCaption = this.swapScreen.buildFailedCaption(amount, tokenInfo.symbol, 'sell');
      await this.bot.telegram.sendMessage(msg.chat.id, failedCaption, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buildCloseKeyboard() },
      });
    }
  }

  private async cleanMessages(chatId: number, messages: Message.TextMessage[]) {
    if (!messages.length) return;
    const messageIds = messages.map((message) => message.message_id);
    await this.bot.telegram.deleteMessages(chatId, messageIds);
  }
}
