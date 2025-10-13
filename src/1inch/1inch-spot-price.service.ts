import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import z from 'zod';
import { env } from '@/env/env';
import { WALLET_CLIENT } from './1inch.constant';
import { ExtendedWalletClient } from './providers/wallet-client.provider';

@Injectable()
export class OneInchSpotPriceService {
  private baseUrl = `${env.ONE_INCH_BASE_URL}/price/v1.1`;

  constructor(@Inject(WALLET_CLIENT) private readonly walletClient: ExtendedWalletClient) {}

  async getTokenPrice(tokenAddress: string) {
    const chainId = await this.walletClient.getChainId();
    const url = `${this.baseUrl}/${chainId}/${tokenAddress}?currency=USD`;
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
