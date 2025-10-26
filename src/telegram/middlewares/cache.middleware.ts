import { Cache } from 'cache-manager';
import { MiddlewareFn } from 'telegraf';
import { Context } from '../interfaces/context.interface';

export function cache(cacheManager: Cache): MiddlewareFn<Context> {
  return async (ctx: Context, next) => {
    ctx.cacheManager = cacheManager;
    return next();
  };
}
