import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { env } from '@/env/env';
import { walletClientProvider } from './providers/wallet-client.provider';
import { OneInchSpotPriceService } from './1inch-spot-price.service';
import { OneInchClassicSwapService } from './1inch-classic-swap.service';
import { OneInchTokenService } from './1inch-token.service';
import { OneInchTokenDetailsService } from './1inch-token-details.service';
import { OneInchBalanceService } from './1inch-balance.service';
import { OneInchFusionSwapService } from './1inch-fusion-swap.service';

@Module({
  imports: [
    CacheModule.register({
      stores: env.REDIS_URL ? [new KeyvRedis(env.REDIS_URL as string)] : [],
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    }),
  ],
  providers: [
    walletClientProvider,
    OneInchBalanceService,
    OneInchClassicSwapService,
    OneInchFusionSwapService,
    OneInchSpotPriceService,
    OneInchTokenDetailsService,
    OneInchTokenService,
  ],
  exports: [
    OneInchBalanceService,
    OneInchClassicSwapService,
    OneInchFusionSwapService,
    OneInchSpotPriceService,
    OneInchTokenDetailsService,
    OneInchTokenService,
  ],
})
export class OneInchModule {}
