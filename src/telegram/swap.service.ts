import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CallbackQuery, Message } from 'telegraf/typings/core/types/typegram';
import { formatUnits } from 'viem';
import { OneInchBalanceService } from '@/1inch/1inch-balance.service';
import { NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS } from '@/common/constants';
import { MsgLogRepository, PreferenceRepository, WalletRepository } from '@/database/repository';
import { Context } from './interfaces/context.interface';
import { SwapScreen } from './screens/swap.screen';
import { OneInchTokenService } from '@/1inch/1inch-token.service';
import { buildCloseKeyboard } from './utils/inline-keyboard';
import { SwapProviderService } from './swap-provider.service';

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
    private readonly oneInchTokenService: OneInchTokenService,
    private readonly swapProviderService: SwapProviderService,
  ) {}

  async buyToken(msg: Exclude<CallbackQuery.DataQuery['message'], undefined>, amount: string, userId: number) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      msgId: msg.message_id,
    });
    if (!msgLog) return;
    const { tokenAddress } = msgLog;
    const preference = await this.preferenceRepository.getByUserId(userId);
    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(userId);
    const messages: Message.TextMessage[] = [];
    try {
      let swapStartedAt = 0;
      await this.swapProviderService.performSwap(
        {
          privateKey,
          fromTokenAddress: this.swapProviderService.nativeTokenAddress,
          fromTokenDecimals: NATIVE_TOKEN_DECIMALS,
          toTokenAddress: tokenAddress,
          amountToSwap: amount,
          slippage: preference.slippage,
        },
        async (status) => {
          if (status === 'swapping') swapStartedAt = Date.now();
          await this.cleanMessages(msg.chat.id, messages);
          const statusCaption = this.swapScreen.buildStatusCaption(status);
          const message = await this.bot.telegram.sendMessage(msg.chat.id, statusCaption, { parse_mode: 'HTML' });
          messages.push(message);
        },
      );
      await this.cleanMessages(msg.chat.id, messages);
      const successCaption = this.swapScreen.buildCaption(amount, NATIVE_TOKEN, 'buy', Date.now() - swapStartedAt);
      await this.bot.telegram.sendMessage(msg.chat.id, successCaption, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buildCloseKeyboard() },
      });
    } catch (error) {
      await this.cleanMessages(msg.chat.id, messages);
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

    const amount = formatUnits((balance * BigInt(percent)) / 100n, tokenInfo.decimals);
    const messages: Message.TextMessage[] = [];
    try {
      let swapStartedAt = 0;
      await this.swapProviderService.performSwap(
        {
          privateKey,
          fromTokenAddress: tokenAddress,
          fromTokenDecimals: tokenInfo.decimals,
          toTokenAddress: this.swapProviderService.nativeTokenAddress,
          amountToSwap: amount,
          slippage: preference.slippage,
        },
        async (status) => {
          if (status === 'swapping') swapStartedAt = Date.now();
          await this.cleanMessages(msg.chat.id, messages);
          const statusCaption = this.swapScreen.buildStatusCaption(status);
          const message = await this.bot.telegram.sendMessage(msg.chat.id, statusCaption, { parse_mode: 'HTML' });
          messages.push(message);
        },
      );
      await this.cleanMessages(msg.chat.id, messages);
      const successCaption = this.swapScreen.buildCaption(amount, tokenInfo.symbol, 'sell', Date.now() - swapStartedAt);
      await this.bot.telegram.sendMessage(msg.chat.id, successCaption, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buildCloseKeyboard() },
      });
    } catch (error) {
      await this.cleanMessages(msg.chat.id, messages);
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
