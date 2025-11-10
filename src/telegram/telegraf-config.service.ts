import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { EnvService } from '@/env/env.service';
import { cache } from './middlewares/cache.middleware';
import { DeleteMessageMiddleware } from './middlewares/delete-message.middleware';

@Injectable()
export class TelegrafConfigService implements TelegrafOptionsFactory {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly deleteMessageMiddleware: DeleteMessageMiddleware,
    private readonly envService: EnvService,
  ) {}

  createTelegrafOptions(): TelegrafModuleOptions {
    return {
      middlewares: [session(), cache(this.cacheManager), this.deleteMessageMiddleware.middleware()],
      token: this.envService.get('TELEGRAM_BOT_TOKEN'),
    };
  }
}
