import { Injectable } from '@nestjs/common';
import { User } from '@telegraf/types';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { DEFAULT_BUY_AMOUNTS } from '@/common/constants';
import { MsgLogRepository, PreferenceRepository } from '@/database/repository';
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
    private readonly preferenceRepository: PreferenceRepository,
    private readonly swapService: SwapService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(ctx: Context, { data, message }: CallbackQuery.DataQuery, user: User) {
    if (!data || !message) return;

    const preferences = await this.preferenceRepository.getByUserId(user.id);
    const buyAmounts = (preferences.buyAmounts ?? DEFAULT_BUY_AMOUNTS).map(String);

    if (data.startsWith('buy-') && buyAmounts.includes(data.split('-')[1])) {
      const tokenAddress = await this.msgLogRepository.getTokenAddress(
        message.chat.id,
        message.message_id,
        user.username,
      );
      await this.swapService.buyToken(message.chat.id, tokenAddress, data.split('-')[1], user.id);
      return;
    }

    const captionByData = {
      [tokenButtons.buyCustom.callback]: buyCustomCaption(),
      [tokenButtons.sellCustom.callback]: sellCustomCaption(),
      [tokenButtons.slippage.callback]: setSlippageCaption(),
    };

    switch (data) {
      case tokenButtons.approveToken.callback:
        await this.swapService.approveToken(message, user.id);
        return;
      case tokenButtons.refresh.callback:
        await this.tokenService.refreshTokenInfo(message.chat.id, message.message_id, user);
        return;
      case tokenButtons.sellHalf.callback:
      case tokenButtons.sellFull.callback: {
        const percent = Number(data.split('-')[1]);
        const tokenAddress = await this.msgLogRepository.getTokenAddress(
          message.chat.id,
          message.message_id,
          user.username,
        );
        await this.swapService.sellToken(message.chat.id, tokenAddress, percent, user.id);
        return;
      }
      case tokenButtons.buyCustom.callback:
      case tokenButtons.sellCustom.callback:
      case tokenButtons.slippage.callback:
        await replyWithDataQueryRepliedMessage(ctx, data, captionByData[data], message.message_id);
        return;
    }
  }
}
