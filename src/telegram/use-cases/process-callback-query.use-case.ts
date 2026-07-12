import { Injectable } from '@nestjs/common';
import { User } from '@telegraf/types';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { getChain } from '@/common/constants';
import { MsgLogRepository } from '@/database/repository';
import { Context } from '../interfaces/context.interface';
import { SwapService } from '../swap.service';
import { TokenService } from '../token.service';
import { tokenButtons } from '../buttons/token.buttons';
import { replyWithDataQueryRepliedMessage } from '../utils/message';
import { buyCustomCaption, sellCustomCaption, setSlippageCaption } from '../captions/token.caption';

@Injectable()
export class ProcessCallbackQueryUseCase {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly msgLogRepository: MsgLogRepository,
    private readonly swapService: SwapService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(ctx: Context, { data, message }: CallbackQuery.DataQuery, user: User) {
    if (!data || !message) return;

    if (data.startsWith('buy-') && data !== tokenButtons.buyCustom.callback) {
      const amount = Number(data.slice('buy-'.length));
      if (Number.isFinite(amount) && amount > 0) {
        const { tokenAddress, chain } = await this.msgLogRepository.getTokenTrade(
          message.chat.id,
          message.message_id,
          user.username,
        );
        await this.swapService.buyToken(message.chat.id, tokenAddress, `${amount}`, user.id, chain);
        return;
      }
    }

    switch (data) {
      case tokenButtons.approveToken.callback:
        await this.swapService.approveToken(message, user.id);
        return;
      case tokenButtons.refresh.callback:
        await this.tokenService.refreshTokenInfo(message.chat.id, message.message_id, user);
        return;
      case tokenButtons.sellQuarter.callback:
      case tokenButtons.sellOneFifth.callback:
      case tokenButtons.sellOneThird.callback:
      case tokenButtons.sellHalf.callback:
      case tokenButtons.sellFull.callback: {
        const percent = Number(data.split('-')[1]);
        const { tokenAddress, chain } = await this.msgLogRepository.getTokenTrade(
          message.chat.id,
          message.message_id,
          user.username,
        );
        await this.swapService.sellToken(message.chat.id, tokenAddress, percent, user.id, chain);
        return;
      }
      case tokenButtons.buyCustom.callback: {
        const { chain } = await this.msgLogRepository.getTokenTrade(message.chat.id, message.message_id, user.username);
        await replyWithDataQueryRepliedMessage(
          ctx,
          data,
          buyCustomCaption(getChain(chain).nativeSymbol),
          message.message_id,
        );
        return;
      }
      case tokenButtons.sellCustom.callback:
        await replyWithDataQueryRepliedMessage(ctx, data, sellCustomCaption(), message.message_id);
        return;
      case tokenButtons.slippage.callback:
        await replyWithDataQueryRepliedMessage(ctx, data, setSlippageCaption(), message.message_id);
        return;
    }
  }
}
