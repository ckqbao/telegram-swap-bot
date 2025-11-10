import { Injectable } from '@nestjs/common';
import { User } from '@telegraf/types';
import { Message } from 'telegraf/typings/core/types/typegram';
import { isInputAmount } from '@/common/utils/number';
import { MsgLogRepository, PreferenceRepository } from '@/database/repository';
import { Context } from '../interfaces/context.interface';
import { tokenButtons } from '../buttons/token.buttons';
import { TokenService } from '../token.service';
import { SwapService } from '../swap.service';

@Injectable()
export class ProcessReplyMessageUseCase {
  constructor(
    private readonly msgLogRepository: MsgLogRepository,
    private readonly preferenceRepository: PreferenceRepository,
    private readonly swapService: SwapService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(ctx: Context, msg: Message.TextMessage, user: User) {
    if (!ctx.session.dataQueryRepliedMessage || !msg.reply_to_message) return;

    switch (ctx.session.dataQueryRepliedMessage.data) {
      case tokenButtons.buyCustom.callback:
        await this.buyCustom(ctx, ctx.session.dataQueryRepliedMessage, msg, user);
        return;
      case tokenButtons.sellCustom.callback:
        await this.sellCustom(ctx, ctx.session.dataQueryRepliedMessage, msg, user);
        return;
      case tokenButtons.slippage.callback:
        await this.setSlippage(ctx, ctx.session.dataQueryRepliedMessage, msg, user);
        return;
      default:
        return;
    }
  }

  private async getMsgLog(
    dataQueryRepliedMessage: Exclude<Context['session']['dataQueryRepliedMessage'], undefined>,
    msg: Message.TextMessage,
    user: User,
  ) {
    const msgLog = await this.msgLogRepository.findMsgLog({
      chatId: msg.chat.id,
      msgId: dataQueryRepliedMessage.parentMsgId,
      username: user.username,
    });

    if (!msgLog) throw new Error('Msg log not found');

    return msgLog;
  }

  private async setSlippage(
    ctx: Context,
    dataQueryRepliedMessage: Exclude<Context['session']['dataQueryRepliedMessage'], undefined>,
    msg: Message.TextMessage,
    user: User,
  ) {
    const msgLog = await this.getMsgLog(dataQueryRepliedMessage, msg, user);
    const slippage = msg.text;
    if (!isInputAmount(slippage)) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }
    await this.preferenceRepository.setSlippage(user.id, Number(slippage));
    await ctx.deleteMessages([msg.message_id, dataQueryRepliedMessage.msgId]);
    await this.tokenService.refreshTokenInfo(msg.chat.id, msgLog.msgId, user);
  }

  private async sellCustom(
    ctx: Context,
    dataQueryRepliedMessage: Exclude<Context['session']['dataQueryRepliedMessage'], undefined>,
    msg: Message.TextMessage,
    user: User,
  ) {
    const msgLog = await this.getMsgLog(dataQueryRepliedMessage, msg, user);
    if (!isInputAmount(msg.text)) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }

    const percent = Number(msg.text);
    await Promise.all([
      ctx.deleteMessages([msg.message_id, dataQueryRepliedMessage.msgId]),
      this.swapService.sellToken(msg.chat.id, msgLog.tokenAddress, percent, user.id),
    ]);
  }

  private async buyCustom(
    ctx: Context,
    dataQueryRepliedMessage: Exclude<Context['session']['dataQueryRepliedMessage'], undefined>,
    msg: Message.TextMessage,
    user: User,
  ) {
    const msgLog = await this.getMsgLog(dataQueryRepliedMessage, msg, user);
    const amount = msg.text;
    if (!isInputAmount(amount)) {
      await ctx.deleteMessage(msg.message_id);
      return;
    }
    await Promise.all([
      ctx.deleteMessages([msg.message_id, dataQueryRepliedMessage.msgId]),
      this.swapService.buyToken(msg.chat.id, msgLog.tokenAddress, amount, user.id),
    ]);
  }
}
