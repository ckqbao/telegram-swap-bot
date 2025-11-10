import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from '../interfaces/context.interface';

export const CtxTextMessage = createParamDecorator((_, ctx: ExecutionContext) => {
  const { message } = TelegrafExecutionContext.create(ctx).getContext<Context>();
  if (!message || !('text' in message)) throw new Error('Text message not found');
  return message;
});
