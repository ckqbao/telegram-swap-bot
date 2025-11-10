import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CallbackQuery, Message } from 'telegraf/typings/core/types/typegram';
import { formatUnits, Hex } from 'viem';
import { OneInchBalanceService } from '@/1inch/1inch-balance.service';
import { NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS } from '@/common/constants';
import { MsgLogRepository, PreferenceRepository, WalletRepository } from '@/database/repository';
import { Context } from './interfaces/context.interface';
import { OneInchTokenService } from '@/1inch/1inch-token.service';
import { SwapProviderService } from './swap-provider.service';
import { swapFailureCaption, swapStatusCaption, swapSuccessCaption } from './captions/swap.caption';
import { closeKeyboard } from './keyboards/common.keyboard';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly walletRepository: WalletRepository,
    private readonly oneInchBalanceService: OneInchBalanceService,
    private readonly oneInchTokenService: OneInchTokenService,
    private readonly swapProviderService: SwapProviderService,
  ) {}

  async approveToken(msg: Exclude<CallbackQuery.DataQuery['message'], undefined>, userId: number) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      msgId: msg.message_id,
    });
    if (!msgLog) return;
    const { tokenAddress } = msgLog;
    const preference = await this.preferenceRepository.getByUserId(userId);
    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(userId);
    const tokenInfo = await this.oneInchTokenService.getTokenInfo(tokenAddress);
    const amount = formatUnits(BigInt(1), tokenInfo.decimals);
    const messages: Message.TextMessage[] = [];
    try {
      await this.swapProviderService.performSwap(
        {
          privateKey,
          fromTokenAddress: tokenAddress,
          fromTokenDecimals: tokenInfo.decimals,
          toTokenAddress: this.swapProviderService.nativeTokenAddress,
          amountToSwap: amount,
          slippage: preference.slippage,
          approveOnly: true,
        },
        async (status) => {
          await this.cleanMessages(msg.chat.id, messages);
          const message = await this.bot.telegram.sendMessage(msg.chat.id, swapStatusCaption(status), {
            parse_mode: 'HTML',
            reply_markup: closeKeyboard().reply_markup,
          });
          messages.push(message);
        },
      );
    } catch (error) {
      await this.cleanMessages(msg.chat.id, messages);
      this.logger.error('Failed to approve token', error);
      await this.bot.telegram.sendMessage(msg.chat.id, 'Failed to approve token', {
        parse_mode: 'HTML',
        reply_markup: closeKeyboard().reply_markup,
      });
    }
  }

  async buyToken(chatId: number, tokenAddress: Hex, amount: string, userId: number) {
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
          await this.cleanMessages(chatId, messages);
          const message = await this.bot.telegram.sendMessage(chatId, swapStatusCaption(status), {
            parse_mode: 'HTML',
          });
          messages.push(message);
        },
      );
      await this.cleanMessages(chatId, messages);
      const successCaption = swapSuccessCaption(amount, NATIVE_TOKEN, 'buy', Date.now() - swapStartedAt);
      await this.bot.telegram.sendMessage(chatId, successCaption, {
        parse_mode: 'HTML',
        reply_markup: closeKeyboard().reply_markup,
      });
    } catch (error) {
      await this.cleanMessages(chatId, messages);
      this.logger.error('Failed to buy token', error);
      const failedCaption = swapFailureCaption(amount, NATIVE_TOKEN, 'buy');
      await this.bot.telegram.sendMessage(chatId, failedCaption, {
        parse_mode: 'HTML',
        reply_markup: closeKeyboard().reply_markup,
      });
    }
  }

  async sellToken(chatId: number, tokenAddress: Hex, percent: number, userId: number) {
    const preference = await this.preferenceRepository.getByUserId(userId);
    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(userId);
    const [tokenInfo, tokenBalances] = await Promise.all([
      this.oneInchTokenService.getTokenInfo(tokenAddress),
      this.oneInchBalanceService.getTokenBalances([tokenAddress], privateKey),
    ]);
    const balance = Object.values(tokenBalances)[0];
    if (!balance) {
      await this.bot.telegram.sendMessage(chatId, 'No balance for this token to sell', {
        parse_mode: 'HTML',
        reply_markup: closeKeyboard().reply_markup,
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
          await this.cleanMessages(chatId, messages);
          const message = await this.bot.telegram.sendMessage(chatId, swapStatusCaption(status), {
            parse_mode: 'HTML',
          });
          messages.push(message);
        },
      );
      await this.cleanMessages(chatId, messages);
      const successCaption = swapSuccessCaption(amount, tokenInfo.symbol, 'sell', Date.now() - swapStartedAt);
      await this.bot.telegram.sendMessage(chatId, successCaption, {
        parse_mode: 'HTML',
        reply_markup: closeKeyboard().reply_markup,
      });
    } catch (error) {
      await this.cleanMessages(chatId, messages);
      this.logger.error('Failed to sell token', error);
      const failedCaption = swapFailureCaption(amount, tokenInfo.symbol, 'sell');
      await this.bot.telegram.sendMessage(chatId, failedCaption, {
        parse_mode: 'HTML',
        reply_markup: closeKeyboard().reply_markup,
      });
    }
  }

  private async cleanMessages(chatId: number, messages: Message.TextMessage[]) {
    if (!messages.length) return;
    const messageIds = messages.map((message) => message.message_id);
    await this.bot.telegram.deleteMessages(chatId, messageIds);
  }
}
