import { Injectable } from '@nestjs/common';
import { TelegrafModuleOptions, TelegrafOptionsFactory } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { EnvService } from '@/env/env.service';

@Injectable()
export class TelegrafConfigService implements TelegrafOptionsFactory {
  constructor(private readonly envService: EnvService) {}

  createTelegrafOptions(): TelegrafModuleOptions {
    return {
      middlewares: [session()],
      token: this.envService.get('TELEGRAM_BOT_TOKEN'),
    };
  }
}
