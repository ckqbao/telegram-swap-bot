import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PublicClient } from 'viem';
import { Currency } from '@pancakeswap/sdk';
import { Pool, SmartRouter } from '@pancakeswap/smart-router';
import { GraphQLClient } from 'graphql-request';
import { V3_SUBGRAPH_CLIENT } from './pcs.constant';
import { VIEM_PUBLIC_CLIENT } from '@/common/constants/provider.constant';

@Injectable()
export class PcsPoolService {
  private readonly logger = new Logger(PcsPoolService.name);
  private readonly POOL_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    @Inject(VIEM_PUBLIC_CLIENT) private readonly publicClient: PublicClient,
    @Inject(V3_SUBGRAPH_CLIENT) private readonly v3subgraphClient: GraphQLClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Get cached pools or fetch new ones if cache is expired
   */
  async getPools(currencyA: Currency, currencyB: Currency): Promise<Pool[]> {
    const cacheKey = this.generateCacheKey(currencyA, currencyB);

    // Try to get from Redis cache
    const cachedJson = await this.cacheManager.get<string>(cacheKey);
    if (cachedJson) {
      this.logger.log(`Using cached pools for ${cacheKey} from Redis`);
      const pools = this.deserializePools(cachedJson);
      return pools;
    }

    // Cache miss - fetch new pools
    this.logger.log(`Cache miss for ${cacheKey}, fetching fresh pools`);
    const pools = await this.fetchCandidatePools(currencyA, currencyB);

    // Serialize pools to JSON string (handles BigInt)
    const serialized = this.serializePools(pools);

    // Store in Redis cache with TTL (in milliseconds)
    this.cacheManager
      .set(cacheKey, serialized, this.POOL_CACHE_TTL)
      .then(() => {
        this.logger.log(`Cached ${pools.length} pools for ${cacheKey} in Redis (TTL: ${this.POOL_CACHE_TTL / 1000}s)`);
      })
      .catch(console.log);

    return pools;
  }

  /**
   * Fetch candidate pools from both V2 and V3
   */
  private async fetchCandidatePools(currencyA: Currency, currencyB: Currency): Promise<Pool[]> {
    try {
      const [v2Pools, v3Pools] = await Promise.all([
        SmartRouter.getV2CandidatePools({
          onChainProvider: () => this.publicClient,
          v3SubgraphProvider: () => this.v3subgraphClient,
          currencyA,
          currencyB,
        }),
        SmartRouter.getV3CandidatePools({
          onChainProvider: () => this.publicClient,
          subgraphProvider: () => this.v3subgraphClient,
          currencyA,
          currencyB,
          subgraphFallback: false,
        }),
      ]);

      this.logger.log(`Fetched ${v2Pools.length} V2 pools and ${v3Pools.length} V3 pools`);
      return [...v2Pools, ...v3Pools];
    } catch (error) {
      this.logger.error(`Failed to fetch candidate pools: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Clear pool cache (useful for testing or forcing refresh)
   */
  private async clearPoolCache(currencyA?: Currency, currencyB?: Currency): Promise<void> {
    if (currencyA && currencyB) {
      const cacheKey = this.generateCacheKey(currencyA, currencyB);
      await this.cacheManager.del(cacheKey);
      this.logger.log(`Cleared pool cache for ${cacheKey} from Redis`);
    } else {
      await this.cacheManager.clear();
      this.logger.log('Cleared all pool cache from Redis');
    }
  }

  /**
   * Generate cache key for pool pairs
   */
  private generateCacheKey(currencyA: Currency, currencyB: Currency): string {
    const addressA = currencyA.isNative ? 'NATIVE' : currencyA.address.toLowerCase();
    const addressB = currencyB.isNative ? 'NATIVE' : currencyB.address.toLowerCase();
    // Sort to ensure consistent cache key regardless of order
    const pairKey = [addressA, addressB].join('-');
    return `pcs:pools:${pairKey}`;
  }

  /**
   * Serialize pools to JSON string, converting BigInt to string
   */
  private serializePools(pools: Pool[]): string {
    return JSON.stringify(pools, (key, value) => {
      // Convert BigInt to string with a special marker
      if (typeof value === 'bigint') {
        return { __type: 'bigint', value: value.toString() };
      }
      return value;
    });
  }

  /**
   * Deserialize pools from JSON string, converting string back to BigInt
   */
  private deserializePools(json: string): Pool[] {
    return JSON.parse(json, (key, value) => {
      // Convert back to BigInt if it has our special marker
      if (
        value &&
        typeof value === 'object' &&
        value.__type === 'bigint' &&
        'value' in value &&
        typeof value.value === 'string'
      ) {
        return BigInt(value.value as string);
      }
      return value;
    });
  }
}
