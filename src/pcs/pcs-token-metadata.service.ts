import { Inject, Injectable, Logger } from '@nestjs/common';
import { Hex, PublicClient, erc20Abi } from 'viem';
import { ERC20Token, SerializedToken } from '@pancakeswap/sdk';
import { VIEM_PUBLIC_CLIENT } from '@/common/constants/provider.constant';
import { MAIN_CHAIN_ID } from '@/common/constants';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PcsTokenMetadataService {
  private readonly logger = new Logger(PcsTokenMetadataService.name);
  private readonly TOKEN_CACHE_TTL = 24 * 60 * 1000;

  constructor(
    @Inject(VIEM_PUBLIC_CLIENT) private readonly publicClient: PublicClient,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Get token metadata (decimals, symbol, name) for the given token addresses
   */
  async getTokenMetadata(tokenAddresses: Hex[]): Promise<ERC20Token[]> {
    const metadataPromises = tokenAddresses.map(async (address) => {
      const cacheKey = `pcs:token:${address}`;
      const cached = await this.cacheManager.get<SerializedToken>(cacheKey);
      if (cached) {
        this.logger.log(`Cache hit for token metadata: ${address}`);
        return new ERC20Token(MAIN_CHAIN_ID, address, cached.decimals, cached.symbol, cached.name);
      }

      this.logger.log(`Cache miss for token metadata: ${address}, fetching from API`);

      const [decimals, symbol, name] = await Promise.all([
        this.publicClient.readContract({
          address,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
        this.publicClient.readContract({
          address,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        this.publicClient.readContract({
          address,
          abi: erc20Abi,
          functionName: 'name',
        }),
      ]);

      const token = new ERC20Token(MAIN_CHAIN_ID, address, decimals, symbol, name);
      void this.cacheManager.set(cacheKey, token.serialize, this.TOKEN_CACHE_TTL);
      return token;
    });

    return Promise.all(metadataPromises);
  }
}
