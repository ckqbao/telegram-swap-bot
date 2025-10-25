import { Module } from '@nestjs/common';
import { OneInchSpotPriceService } from './1inch-spot-price.service';
import { OneInchClassicSwapService } from './1inch-classic-swap.service';
import { OneInchTokenService } from './1inch-token.service';
import { OneInchTokenDetailsService } from './1inch-token-details.service';
import { OneInchBalanceService } from './1inch-balance.service';
import { OneInchFusionSwapService } from './1inch-fusion-swap.service';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [CommonModule],
  providers: [
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
