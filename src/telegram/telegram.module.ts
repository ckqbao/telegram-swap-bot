import { Module, Provider } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegrafConfigService } from './telegraf-config.service';
import { EnvModule } from 'src/env/env.module';
import { EnvService } from '@/env/env.service';
import { BotUpdate } from './bot.update';
import { JupiterModule } from '@/jupiter/jupiter.module';
import { ProcessCallbackQueryUseCase } from './use-cases/process-callback-query.use-case';
import { OneInchModule } from '@/1inch/1inch.module';
import { ProcessTextUseCase } from './use-cases/process-text.use-case';
import { SwapService } from './swap.service';
import { TokenService } from './token.service';
import { PcsModule } from '@/pcs/pcs.module';
import { SwapProviderService } from './swap-provider.service';
// import { PcsSwapService } from '@/pcs/pcs-swap.service';
import { CommonModule } from '@/common/common.module';
import { OkxModule } from '@/okx/okx.module';
import { OkxSwapService } from '@/okx/okx-swap.service';
import * as scenes from './scenes';
import { BotCommandService } from './bot-command.service';
import { DeleteMessageMiddleware } from './middlewares/delete-message.middleware';
import { ProcessReplyMessageUseCase } from './use-cases/process-reply-message.use-case';

const sceneProviders: Provider[] = Object.values(scenes);

@Module({
  imports: [
    CommonModule,
    JupiterModule,
    OkxModule,
    OneInchModule,
    PcsModule,
    TelegrafModule.forRootAsync({
      imports: [EnvModule, TelegramModule],
      inject: [DeleteMessageMiddleware, EnvService],
      useClass: TelegrafConfigService,
    }),
  ],
  providers: [
    ...sceneProviders,
    DeleteMessageMiddleware,
    {
      provide: SwapProviderService,
      useClass: OkxSwapService,
    },
    BotCommandService,
    BotUpdate,
    SwapService,
    TokenService,
    ProcessCallbackQueryUseCase,
    ProcessReplyMessageUseCase,
    ProcessTextUseCase,
  ],
  exports: [DeleteMessageMiddleware],
})
export class TelegramModule {}
