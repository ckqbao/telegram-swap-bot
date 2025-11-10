import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from '../interfaces/context.interface';

export const CtxDataQuery = createParamDecorator((_, ctx: ExecutionContext) => {
  const { callbackQuery } = TelegrafExecutionContext.create(ctx).getContext<Context>();
  if (!callbackQuery || !('data' in callbackQuery)) throw new Error('Callback data query not found');
  return callbackQuery;
});
