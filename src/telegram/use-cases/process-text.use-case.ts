import { Injectable } from '@nestjs/common';
import { User } from '@telegraf/types';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import { isAddress } from 'viem';
import { Context } from '../interfaces/context.interface';
import { TokenService } from '../token.service';

@Injectable()
export class ProcessTextUseCase {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly tokenService: TokenService,
  ) {}

  async execute(ctx: Context, msg: Message.TextMessage, user: User) {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    if (!messageText) return;

    await ctx.deleteMessage(msg.message_id);

    if (!isAddress(messageText)) return;

    if (ctx.session.dataQueryRepliedMessage) await ctx.deleteMessage(ctx.session.dataQueryRepliedMessage.msgId);

    const tokenAddress = messageText;

    await this.tokenService.getTokenInfo(chatId, tokenAddress, user);
  }
}
