import { Injectable } from '@nestjs/common';
import { User } from '@telegraf/types';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { MaybeInaccessibleMessage } from 'telegraf/typings/core/types/typegram';
import { isAddress } from 'viem';
import { Context } from './interfaces/context.interface';
import { MsgLogRepository, PreferenceRepository } from '@/database/repository';
import { TokenInfoScreen } from './screens/token-info.screen';
import { OneInchSpotPriceService } from '@/1inch/1inch-spot-price.service';
import { OneInchTokenDetailsService } from '@/1inch/1inch-token-details.service';
import { OneInchTokenService } from '@/1inch/1inch-token.service';

@Injectable()
export class TokenService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly tokenInfoScreen: TokenInfoScreen,
    private readonly oneInchSpotPriceService: OneInchSpotPriceService,
    private readonly oneInchTokenDetailsService: OneInchTokenDetailsService,
    private readonly oneInchTokenService: OneInchTokenService,
  ) {}

  async refreshTokenInfoScreen(msg: MaybeInaccessibleMessage, user: User) {
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
