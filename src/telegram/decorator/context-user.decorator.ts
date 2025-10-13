import { createParamDecorator, ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Context } from '../interfaces/context.interface';

function getContextUser(ctx: ExecutionContext) {
  const telegrafCtx = TelegrafExecutionContext.create(ctx).getContext<Context>();
  const user = telegrafCtx.from;
  if (!user) throw new UnauthorizedException('User is not defined');
  return user;
}

export const CtxUser = createParamDecorator((_, ctx: ExecutionContext) => {
  return getContextUser(ctx);
});

export const CtxUsername = createParamDecorator((_, ctx: ExecutionContext) => {
  const user = getContextUser(ctx);
  if (!user.username) throw new NotFoundException('username is missing');
  return user.username;
});
