import { Injectable, InternalServerErrorException } from '@nestjs/common';
import z from 'zod';
import { env } from '@/env/env';
import { MAIN_CHAIN_ID } from '@/common/constants';

@Injectable()
export class OneInchSpotPriceService {
  private baseUrl = `${env.ONE_INCH_BASE_URL}/price/v1.1`;

  constructor() {}

  async getTokenPrice(tokenAddress: string) {
    const url = `${this.baseUrl}/${MAIN_CHAIN_ID}/${tokenAddress}?currency=USD`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.ONE_INCH_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to fetch token price');
    }

    const data = await response.json();
    const parsedData = z.record(z.string(), z.coerce.number()).parse(data);
    return Object.values(parsedData)[0];
  }
}
