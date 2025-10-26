import { Module, Provider } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegrafConfigService } from './telegraf-config.service';
import { EnvModule } from 'src/env/env.module';
import { EnvService } from '@/env/env.service';
import { BotUpdate } from './bot.update';
import { BotService } from './bot.service';
import { JupiterModule } from '@/jupiter/jupiter.module';
import { ProcessCallbackQueryUseCase } from './use-cases/process-callback-query.use-case';
import { OneInchModule } from '@/1inch/1inch.module';
import { ProcessMessageTextUseCase } from './use-cases/process-message-text.use-case';
import { SwapService } from './swap.service';
import { TokenService } from './token.service';
import { PcsModule } from '@/pcs/pcs.module';
import { SwapProviderService } from './swap-provider.service';
// import { PcsSwapService } from '@/pcs/pcs-swap.service';
import { CommonModule } from '@/common/common.module';
import { OkxModule } from '@/okx/okx.module';
import { OkxSwapService } from '@/okx/okx-swap.service';
import * as scenes from './scenes';
import * as screens from './screens';
import { BotCommandInterceptor } from './interceptors/bot-command.interceptor';

const sceneProviders: Provider[] = Object.values(scenes);
const screenProviders: Provider[] = Object.values(screens);

@Module({
  imports: [
    CommonModule,
    JupiterModule,
    OkxModule,
    OneInchModule,
    PcsModule,
    TelegrafModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useClass: TelegrafConfigService,
    }),
  ],
  providers: [
    ...sceneProviders,
    ...screenProviders,
    {
      provide: SwapProviderService,
      useClass: OkxSwapService,
    },
    BotCommandInterceptor,
    BotService,
    BotUpdate,
    SwapService,
    TokenService,
    ProcessCallbackQueryUseCase,
    ProcessMessageTextUseCase,
  ],
})
export class TelegramModule {}
