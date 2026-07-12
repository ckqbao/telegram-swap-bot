import { env } from '@/env/env';
import { Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Hex } from 'viem';
import { tokenInfoSchema, tokensInfoSchema, TokenInfo, TokensInfo } from './types/token';

@Injectable()
export class OneInchTokenService {
  private readonly logger = new Logger(OneInchTokenService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/token/v1.4`;
  private TOKEN_CACHE_TTL = 24 * 60 * 60 * 1000;

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async getTokenInfo(address: Hex, chainId: number): Promise<TokenInfo> {
    const cacheKey = `token:${chainId}:${address.toLowerCase()}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<TokenInfo>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for token info: ${address}`);
      return cached;
    }

    // Fetch from API
    this.logger.debug(`Cache miss for token info: ${address}, fetching from API`);
    const url = `${this.baseUrl}/${chainId}/custom/${address}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.ONE_INCH_API_KEY}`,
      },
    });

    if (response.status === 404) {
      throw new NotFoundException(
        'Token not found on the selected chain — double-check which chain this token lives on',
      );
    }

    if (!response.ok) {
      this.logger.error(`Failed to fetch token info: ${response.status} ${await response.text()}`);
      throw new InternalServerErrorException('Failed to fetch token info');
    }

    const data = await response.json();
    const tokenInfo = tokenInfoSchema.parse(data);

    // Store in cache
    void this.cacheManager.set(cacheKey, tokenInfo, this.TOKEN_CACHE_TTL);

    return tokenInfo;
  }

  async getTokensInfo(tokenAddresses: Hex[], chainId: number): Promise<TokensInfo> {
    const normalizedAddresses = tokenAddresses.map((addr) => addr.toLowerCase() as Hex);
    const cacheKey = `tokens:${chainId}:${normalizedAddresses.sort().join(',')}`;

    // Try to get from cache
    const cached = await this.cacheManager.get<TokensInfo>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for tokens info: ${tokenAddresses.length} tokens`);
      return cached;
    }

    // Fetch from API
    this.logger.debug(`Cache miss for tokens info: ${tokenAddresses.length} tokens, fetching from API`);
    const url = `${this.baseUrl}/${chainId}/custom?addresses=${tokenAddresses.join(',')}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.ONE_INCH_API_KEY}`,
      },
    });

    if (!response.ok) {
      this.logger.error(`Failed to fetch tokens info: ${response.status} ${await response.text()}`);
      throw new InternalServerErrorException('Failed to fetch tokens info');
    }

    const data = await response.json();
    const tokensInfo = tokensInfoSchema.parse(data);

    // Store in cache
    void this.cacheManager.set(cacheKey, tokensInfo, this.TOKEN_CACHE_TTL);

    return tokensInfo;
  }
}
