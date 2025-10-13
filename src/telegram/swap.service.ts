import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { parseUnits } from 'viem';
import { OneInchBalanceService } from '@/1inch/1inch-balance.service';
import { OneInchClassicSwapService } from '@/1inch/1inch-classic-swap.service';
import { NATIVE_TOKEN, TOKEN_ADDRESS, TOKEN_DECIMALS } from '@/common/constants';
import { MsgLogRepository, WalletRepository } from '@/database/repository';
import { Context } from './interfaces/context.interface';
import { SwapScreen } from './screens/swap.screen';

@Injectable()
export class SwapService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly walletRepository: WalletRepository,
    private readonly swapScreen: SwapScreen,
    private readonly oneInchBalanceService: OneInchBalanceService,
    private readonly oneInchClassicSwapService: OneInchClassicSwapService,
  ) {}

  async buyToken(msg: Exclude<CallbackQuery.DataQuery['message'], undefined>, amount: number, userId: number) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      msgId: msg.message_id,
    });
    if (!msgLog) return;
    const { tokenAddress } = msgLog;
    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(userId);
    try {
      await this.oneInchClassicSwapService.performSwap({
        privateKey,
        tokenAddress: TOKEN_ADDRESS[NATIVE_TOKEN],
        dstToken: tokenAddress,
        amountToSwap: parseUnits(`${amount}`, TOKEN_DECIMALS),
        slippage: 1,
      });
      const successCaption = this.swapScreen.buildCaption('buy');
      await this.bot.telegram.sendMessage(msg.chat.id, successCaption, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(error);
      const failedCaption = this.swapScreen.buildFailedCaption('buy');
      await this.bot.telegram.sendMessage(msg.chat.id, failedCaption, {
        parse_mode: 'HTML',
      });
    }
  }

  async sellToken(msg: Exclude<CallbackQuery.DataQuery['message'], undefined>, percent: number, userId: number) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      msgId: msg.message_id,
    });
    if (!msgLog) return;
    const { tokenAddress } = msgLog;

    const privateKey = await this.walletRepository.getMainWalletPrivateKeyForUser(userId);
    const tokenBalances = await this.oneInchBalanceService.getTokenBalances([tokenAddress], privateKey);
    const balance = Object.values(tokenBalances)[0];
    if (!balance) {
      await this.bot.telegram.sendMessage(msg.chat.id, 'No balance for this token to sell', { parse_mode: 'HTML' });
      return;
    }

    try {
      await this.oneInchClassicSwapService.performSwap({
        privateKey,
        tokenAddress,
        dstToken: TOKEN_ADDRESS[NATIVE_TOKEN],
        amountToSwap: balance / BigInt(percent / 100),
        slippage: 1,
      });
      const successCaption = this.swapScreen.buildCaption('sell');
      await this.bot.telegram.sendMessage(msg.chat.id, successCaption, {
        parse_mode: 'HTML',
      });
    } catch (error) {
      console.error(error);
      const failedCaption = this.swapScreen.buildFailedCaption('sell');
      await this.bot.telegram.sendMessage(msg.chat.id, failedCaption, {
        parse_mode: 'HTML',
      });
    }
  }
}
