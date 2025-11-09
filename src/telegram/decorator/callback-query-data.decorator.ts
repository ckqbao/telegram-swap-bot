import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from '../interfaces/context.interface';

export const CallbackQueryData = createParamDecorator((_, ctx: ExecutionContext) => {
  const { callbackQuery } = TelegrafExecutionContext.create(ctx).getContext<Context>();

  if (callbackQuery && 'data' in callbackQuery) {
    return callbackQuery.data;
  }

  throw new Error('Callback query data not found');
});
