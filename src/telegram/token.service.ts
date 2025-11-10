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
import { NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS } from '@/common/constants';
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

  private async prepareTokenInfoContext(tokenAddress: Hex, user: User) {
    const wallet = await this.walletRepository.getUserMainWallet(user.id);
    const [tokenBalances, tokenInfo, price, marketCap] = await Promise.all([
      this.oneInchBalanceService.getTokenBalances([ONE_INCH_NATIVE_TOKEN_ADDRESS], wallet.privateKey),
      this.oneInchTokenService.getTokenInfo(tokenAddress),
      this.oneInchSpotPriceService.getTokenPrice(tokenAddress),
      this.oneInchTokenDetailsService.getTokenMarketCap(tokenAddress),
    ]);
    const preference = await this.preferenceRepository.getByUserId(user.id);
    const walletBalance = `${formatUnits(tokenBalances[ONE_INCH_NATIVE_TOKEN_ADDRESS], NATIVE_TOKEN_DECIMALS)} ${NATIVE_TOKEN}`;
    const caption = tokenInfoCaption(
      { name: tokenInfo.name, symbol: tokenInfo.symbol, mint: tokenAddress, price, marketCap },
      wallet.name,
      walletBalance,
    );
    return { caption, preference };
  }

  async getTokenInfo(chatId: number, tokenAddress: Hex, user: User) {
    const { caption, preference } = await this.prepareTokenInfoContext(tokenAddress, user);
    const tokenInfoMessage = await this.bot.telegram.sendMessage(chatId, caption, {
      link_preview_options: {
        is_disabled: true,
      },
      parse_mode: 'HTML',
      reply_markup: tokenInfoKeyboard({ buyAmounts: preference.buyAmounts, slippage: preference.slippage })
        .reply_markup,
    });

    await this.msgLogRepository.createMsgLog({
      chatId,
      tokenAddress,
      msgId: tokenInfoMessage.message_id,
      username: user.username ?? '',
    });
  }

  async refreshTokenInfo(chatId: number, msgId: number, user: User) {
    const tokenAddress = await this.msgLogRepository.getTokenAddress(chatId, msgId, user.username);
    const { caption, preference } = await this.prepareTokenInfoContext(tokenAddress, user);
    await this.bot.telegram.editMessageText(chatId, msgId, undefined, caption, {
      link_preview_options: {
        is_disabled: true,
      },
      parse_mode: 'HTML',
      reply_markup: tokenInfoKeyboard({ buyAmounts: preference.buyAmounts, slippage: preference.slippage })
        .reply_markup,
    });
  }
}
