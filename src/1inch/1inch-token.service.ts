import { env } from '@/env/env';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Hex } from 'viem';
import { WALLET_CLIENT } from './1inch.constant';
import { tokenInfoSchema, tokensInfoSchema } from './types/token';
import { ExtendedWalletClient } from './providers/wallet-client.provider';

@Injectable()
export class OneInchTokenService {
  private readonly logger = new Logger(OneInchTokenService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/token/v1.4`;

  constructor(@Inject(WALLET_CLIENT) private readonly walletClient: ExtendedWalletClient) {}

  async getTokenInfo(address: Hex) {
    const chainId = await this.walletClient.getChainId();
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
    return tokenInfoSchema.parse(data);
  }

  async getTokensInfo(tokenAddresses: Hex[]) {
    const chainId = await this.walletClient.getChainId();
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
    return tokensInfoSchema.parse(data);
  }
}
