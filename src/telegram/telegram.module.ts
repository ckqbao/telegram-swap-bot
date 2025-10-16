import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegrafConfigService } from './telegraf-config.service';
import { EnvModule } from 'src/env/env.module';
import { EnvService } from '@/env/env.service';
import { BotUpdate } from './bot.update';
import { WelcomeScreen } from './screens/welcome.screen';
import { BotService } from './bot.service';
import { JupiterModule } from '@/jupiter/jupiter.module';
import { TokenInfoScreen } from './screens/token-info.screen';
import { ProcessCallbackQueryUseCase } from './use-cases/process-callback-query.use-case';
import { OneInchModule } from '@/1inch/1inch.module';
import { ProcessMessageTextUseCase } from './use-cases/process-message-text.use-case';
import { BalanceScreen } from './screens/balance.screen';
import { SwapScreen } from './screens/swap.screen';
import { WalletSettingsScene } from './scenes/wallet-settings.scene';
import { SetMainWalletScene } from './scenes/set-main-wallet.scene';
import { SwapService } from './swap.service';
import { BuyTokenCustomScene } from './scenes/buytoken-custom.scene';
import { SellTokenCustomScene } from './scenes/selltoken-custom.scene';
import { SetSlippageScene } from './scenes/set-slippage.scene';
import { TokenService } from './token.service';

@Module({
  imports: [
    JupiterModule,
    OneInchModule,
    TelegrafModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useClass: TelegrafConfigService,
    }),
  ],
  providers: [
    BotService,
    BotUpdate,
    BuyTokenCustomScene,
    SellTokenCustomScene,
    SetMainWalletScene,
    SetSlippageScene,
    WalletSettingsScene,
    BalanceScreen,
    SwapScreen,
    TokenInfoScreen,
    WelcomeScreen,
    SwapService,
    TokenService,
    ProcessCallbackQueryUseCase,
    ProcessMessageTextUseCase,
  ],
})
export class TelegramModule {}
