import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { EnvService } from '@/env/env.service';
import { cache } from './middlewares/cache.middleware';

@Injectable()
export class TelegrafConfigService implements TelegrafOptionsFactory {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly envService: EnvService,
  ) {}

  createTelegrafOptions(): TelegrafModuleOptions {
    return {
      middlewares: [session(), cache(this.cacheManager)],
      token: this.envService.get('TELEGRAM_BOT_TOKEN'),
    };
  }
}
