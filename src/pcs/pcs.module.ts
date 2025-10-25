import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { env } from '@/env/env';
import { PcsBalanceService } from './pcs-balance.service';
import { PcsSwapService } from './pcs-swap.service';
import { PcsTokenApprovalService } from './pcs-token-approval.service';
import { PcsPoolService } from './pcs-pool.service';
import { PcsTokenMetadataService } from './pcs-token-metadata.service';
import { v3SubgraphClientProvider } from './providers/v3-subgraph-client.provider';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [
    CacheModule.register({
      stores: env.REDIS_URL ? [new KeyvRedis(env.REDIS_URL)] : [],
      ttl: 30 * 60 * 1000, // 30 minutes default TTL (increased for better performance)
    }),
    CommonModule,
  ],
  providers: [
    v3SubgraphClientProvider,
    PcsTokenMetadataService,
    PcsTokenApprovalService,
    PcsPoolService,
    PcsBalanceService,
    PcsSwapService,
  ],
  exports: [PcsBalanceService, PcsPoolService, PcsTokenMetadataService, PcsTokenApprovalService, PcsSwapService],
})
export class PcsModule {}
