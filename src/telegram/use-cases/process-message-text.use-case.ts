import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { isAddress } from 'viem';
import { OneInchSpotPriceService } from '@/1inch/1inch-spot-price.service';
import { OneInchTokenDetailsService } from '@/1inch/1inch-token-details.service';
import { OneInchTokenService } from '@/1inch/1inch-token.service';
import { MsgLogRepository, PreferenceRepository } from '@/database/repository';
import { Context } from '../interfaces/context.interface';
import { TokenInfoScreen } from '../screens/token-info.screen';
import { User } from '@telegraf/types';

@Injectable()
export class ProcessMessageTextUseCase {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly oneInchSpotPriceService: OneInchSpotPriceService,
    private readonly oneInchTokenDetailsService: OneInchTokenDetailsService,
    private readonly oneInchTokenService: OneInchTokenService,
    private readonly tokenInfoScreen: TokenInfoScreen,
  ) {}

  async execute(msg: Message.TextMessage, user: User) {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (!messageText) return;

    if (!isAddress(messageText)) {
      await this.bot.telegram.deleteMessage(chatId, msg.message_id);
      return;
    }

    void this.bot.telegram.deleteMessage(chatId, msg.message_id);
    const tokenAddress = messageText;

    const [tokenInfo, price, marketCap] = await Promise.all([
      this.oneInchTokenService.getTokenInfo(tokenAddress),
      this.oneInchSpotPriceService.getTokenPrice(tokenAddress),
      this.oneInchTokenDetailsService.getTokenMarketCap(tokenAddress),
    ]);

    const preference = await this.preferenceRepository.getByUserId(user.id);
    const caption = this.tokenInfoScreen.buildCaption(tokenInfo.name, tokenInfo.symbol, tokenAddress, price, marketCap);
    const inlineKeyboard = this.tokenInfoScreen.buildInlineKeyboard({
      buyGas: preference.buyGas,
      sellGas: preference.sellGas,
      slippage: preference.slippage,
    });

    const tokenInfoMessage = await this.bot.telegram.sendMessage(chatId, caption, {
      link_preview_options: {
        is_disabled: true,
      },
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    });

    await this.msgLogRepository.createMsgLog({
      chatId,
      tokenAddress,
      msgId: tokenInfoMessage.message_id,
      username: user.username ?? '',
    });
  }
}
