import { env } from '@/env/env';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Hex } from 'viem';
import { WALLET_CLIENT } from './1inch.constant';
import { tokenInfoSchema, tokensInfoSchema, TokenInfo, TokensInfo } from './types/token';
import { ExtendedWalletClient } from './providers/wallet-client.provider';

@Injectable()
export class OneInchTokenService {
  private readonly logger = new Logger(OneInchTokenService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/token/v1.4`;

  constructor(
    @Inject(WALLET_CLIENT) private readonly walletClient: ExtendedWalletClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getTokenInfo(address: Hex): Promise<TokenInfo> {
    const chainId = await this.walletClient.getChainId();
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

    if (!response.ok) {
      this.logger.error(`Failed to fetch token info: ${JSON.stringify(response)}`);
      throw new InternalServerErrorException('Failed to fetch token info');
    }

    const data = await response.json();
    const tokenInfo = tokenInfoSchema.parse(data);

    // Store in cache
    await this.cacheManager.set(cacheKey, tokenInfo);

    return tokenInfo;
  }

  async getTokensInfo(tokenAddresses: Hex[]): Promise<TokensInfo> {
    const chainId = await this.walletClient.getChainId();
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
      this.logger.error(`Failed to fetch tokens info: ${JSON.stringify(response)}`);
      throw new InternalServerErrorException('Failed to fetch tokens info');
    }

    const data = await response.json();
    const tokensInfo = tokensInfoSchema.parse(data);

    // Store in cache
    await this.cacheManager.set(cacheKey, tokensInfo);

    return tokensInfo;
  }
}
