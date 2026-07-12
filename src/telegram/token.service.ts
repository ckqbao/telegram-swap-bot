import { Injectable } from '@nestjs/common';
import { User } from '@telegraf/types';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { formatUnits, Hex } from 'viem';
import { Context } from './interfaces/context.interface';
import { MsgLogRepository, PreferenceRepository, WalletRepository } from '@/database/repository';
import { OneInchSpotPriceService } from '@/1inch/1inch-spot-price.service';
import { OneInchTokenDetailsService } from '@/1inch/1inch-token-details.service';
import { OneInchTokenService } from '@/1inch/1inch-token.service';
import { tokenInfoKeyboard } from './keyboards/token.keyboards';
import { tokenInfoCaption } from './captions/token.caption';
import { OneInchBalanceService } from '@/1inch/1inch-balance.service';
import { ChainKey, getChain } from '@/common/constants';
import { resolveBuyAmounts, resolveChainKey } from '@/common/utils';
import { ONE_INCH_NATIVE_TOKEN_ADDRESS } from '@/1inch/1inch.constant';

@Injectable()
export class TokenService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly walletRepository: WalletRepository,
    private readonly oneInchBalanceService: OneInchBalanceService,
    private readonly oneInchSpotPriceService: OneInchSpotPriceService,
    private readonly oneInchTokenDetailsService: OneInchTokenDetailsService,
    private readonly oneInchTokenService: OneInchTokenService,
  ) {}

  private async prepareTokenInfoContext(
    tokenAddress: Hex,
    user: User,
    chainKey: ChainKey,
    preference: Awaited<ReturnType<PreferenceRepository['getByUserId']>>,
  ) {
    const chain = getChain(chainKey);
    const chainId = chain.viemChain.id;
    const wallet = await this.walletRepository.getUserMainWallet(user.id);
    const [tokenBalances, tokenInfo, price, marketCap] = await Promise.all([
      this.oneInchBalanceService.getTokenBalances([ONE_INCH_NATIVE_TOKEN_ADDRESS], wallet.privateKey, chainId),
      this.oneInchTokenService.getTokenInfo(tokenAddress, chainId),
      this.oneInchSpotPriceService.getTokenPrice(tokenAddress, chainId),
      this.oneInchTokenDetailsService.getTokenMarketCap(tokenAddress, chainId),
    ]);
    const walletBalance = `${formatUnits(tokenBalances[ONE_INCH_NATIVE_TOKEN_ADDRESS], chain.nativeDecimals)} ${chain.nativeSymbol}`;
    const caption = tokenInfoCaption(
      { name: tokenInfo.name, symbol: tokenInfo.symbol, mint: tokenAddress, price, marketCap },
      wallet.name,
      walletBalance,
      chainKey,
    );
    const replyMarkup = tokenInfoKeyboard({
      buyAmounts: resolveBuyAmounts(preference, chainKey),
      slippage: preference.slippage,
      nativeSymbol: chain.nativeSymbol,
    }).reply_markup;
    return { caption, replyMarkup };
  }

  async getTokenInfo(chatId: number, tokenAddress: Hex, user: User) {
    const preference = await this.preferenceRepository.getByUserId(user.id);
    const chainKey = resolveChainKey(preference);
    const { caption, replyMarkup } = await this.prepareTokenInfoContext(tokenAddress, user, chainKey, preference);
    const tokenInfoMessage = await this.bot.telegram.sendMessage(chatId, caption, {
      link_preview_options: {
        is_disabled: true,
      },
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });

    await this.msgLogRepository.createMsgLog({
      chain: chainKey,
      chatId,
      tokenAddress,
      msgId: tokenInfoMessage.message_id,
      username: user.username ?? '',
    });
  }

  async refreshTokenInfo(chatId: number, msgId: number, user: User) {
    const { tokenAddress, chain } = await this.msgLogRepository.getTokenTrade(chatId, msgId, user.username);
    const preference = await this.preferenceRepository.getByUserId(user.id);
    const { caption, replyMarkup } = await this.prepareTokenInfoContext(tokenAddress, user, chain, preference);
    await this.bot.telegram.editMessageText(chatId, msgId, undefined, caption, {
      link_preview_options: {
        is_disabled: true,
      },
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    });
  }
}
