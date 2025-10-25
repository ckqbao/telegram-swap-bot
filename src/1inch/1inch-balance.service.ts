import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Hex } from 'viem';
import { nonceManager, privateKeyToAccount } from 'viem/accounts';
import z from 'zod';
import { env } from '@/env/env';
import { hexSchema } from '@/common/utils/zod-schema';
import { MAIN_CHAIN_ID } from '@/common/constants';

@Injectable()
export class OneInchBalanceService {
  private readonly logger = new Logger(OneInchBalanceService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/balance/v1.2`;

  constructor() {}

  async getTokenBalances(tokens: Hex[], privateKey: Hex) {
    const account = privateKeyToAccount(privateKey, { nonceManager });
    const walletAddress = account.address;
    const url = `${this.baseUrl}/${MAIN_CHAIN_ID}/balances/${walletAddress}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.ONE_INCH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tokens }),
    });

    if (!response.ok) {
      this.logger.error(`Failed to fetch token balances: ${JSON.stringify(response)}`);
      throw new InternalServerErrorException('Failed to fetch token balances');
    }

    const data = await response.json();
    return z.record(hexSchema, z.coerce.bigint()).parse(data);
  }
}
