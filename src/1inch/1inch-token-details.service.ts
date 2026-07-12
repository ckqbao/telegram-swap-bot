import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Hex } from 'viem';
import z from 'zod';
import { env } from '@/env/env';
import { tokenDetailsSchema } from './types/token-details';

@Injectable()
export class OneInchTokenDetailsService {
  private readonly logger = new Logger(OneInchTokenDetailsService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/token-details/v1.0/details`;

  constructor() {}

  async getTokenDetails(tokenAddress: Hex, chainId: number) {
    const url = `${this.baseUrl}/${chainId}/${tokenAddress}?provider=coinmarketcap`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.ONE_INCH_API_KEY}`,
      },
    });

    if (!response.ok) {
      this.logger.error(`Failed to fetch token details: ${response.status} ${await response.text()}`);
      throw new InternalServerErrorException('Failed to fetch token details');
    }

    const data = await response.json();
    const { details } = z.object({ details: tokenDetailsSchema }).parse(data);
    return details;
  }

  async getTokenMarketCap(tokenAddress: Hex, chainId: number) {
    try {
      const details = await this.getTokenDetails(tokenAddress, chainId);
      return details.marketCap;
    } catch (error) {
      this.logger.error(`Failed to fetch token market cap: ${error}`);
      return 0;
    }
  }
}
