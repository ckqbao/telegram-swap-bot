import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Hex } from 'viem';
import { nonceManager, privateKeyToAccount } from 'viem/accounts';
import z from 'zod';
import { env } from '@/env/env';
import { WALLET_CLIENT } from './1inch.constant';
import { hexSchema } from '@/common/utils/zod-schema';
import { ExtendedWalletClient } from './providers/wallet-client.provider';

@Injectable()
export class OneInchBalanceService {
  private readonly logger = new Logger(OneInchBalanceService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/balance/v1.2`;

  constructor(@Inject(WALLET_CLIENT) private readonly walletClient: ExtendedWalletClient) {}

  async getTokenBalances(tokens: Hex[], privateKey: Hex) {
    const account = privateKeyToAccount(privateKey, { nonceManager });
    const walletAddress = account.address;
    const chainId = await this.walletClient.getChainId();
    const url = `${this.baseUrl}/${chainId}/balances/${walletAddress}`;
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
