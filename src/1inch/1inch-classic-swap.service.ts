import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Hex, PrivateKeyAccount } from 'viem';
import { nonceManager, privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import z from 'zod';
import { buildQueryURL } from '@/common/utils/url';
import { env } from '@/env/env';
import { allowanceResponseSchema } from './types/allowance';
import { approveTransactionResponseSchema } from './types/transaction';
import { swapResponseSchema } from './types/swap';
import { WALLET_CLIENT } from './1inch.constant';
import { ExtendedWalletClient } from './providers/wallet-client.provider';

@Injectable()
export class OneInchClassicSwapService {
  private readonly logger = new Logger(OneInchClassicSwapService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/swap/v6.1`;

  constructor(@Inject(WALLET_CLIENT) private readonly walletClient: ExtendedWalletClient) {}

  async performSwap(
    config: {
      privateKey: string;
      tokenAddress: string;
      dstToken: string;
      amountToSwap: bigint;
      slippage: number;
    },
    onStatusUpdate?: (status: 'approving' | 'approved' | 'swapping') => Promise<void>,
  ): Promise<void> {
    const account = privateKeyToAccount(config.privateKey as Hex, { nonceManager });

    const swapParams = {
      src: config.tokenAddress,
      dst: config.dstToken,
      amount: config.amountToSwap.toString(),
      from: account.address,
      slippage: config.slippage.toString(),
      disableEstimate: 'false',
      allowPartialFill: 'false',
    };

    const allowance = await this.getAllowance(swapParams.src, swapParams.from);

    if (allowance < config.amountToSwap) {
      await onStatusUpdate?.('approving');
      const approveTx = await this.getApproveTx({ amount: config.amountToSwap, tokenAddress: swapParams.src });
      const approveTxHash = await this.sendTransaction(account, approveTx);
      await this.walletClient.waitForTransactionReceipt({ hash: approveTxHash as Hex, retryCount: 3 });
      await onStatusUpdate?.('approved');
    }

    await onStatusUpdate?.('swapping');
    const { tx } = await this.call1inchAPI('/swap', swapParams, swapResponseSchema);

    const txHash = await this.sendTransaction(account, tx);
    console.log('Swap transaction sent. Hash:', txHash);
  }

  private async call1inchAPI<T>(endpoint: string, queryParams: Record<string, string>, schema: z.ZodSchema<T>) {
    const chainId = await this.walletClient.getChainId();
    const url = buildQueryURL(`${this.baseUrl}/${chainId}${endpoint}`, queryParams);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.ONE_INCH_API_KEY}`,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`1inch API returned status ${response.status}: ${body}`);
      throw new InternalServerErrorException(`Failed to call 1inch API`);
    }

    const result = await response.json();
    const parsedResult = await schema.parseAsync(result);

    return parsedResult;
  }

  private async getAllowance(tokenAddress: string, walletAddress: string): Promise<bigint> {
    console.log('Checking token allowance...');

    const response = await this.call1inchAPI(
      '/approve/allowance',
      {
        tokenAddress,
        walletAddress,
      },
      allowanceResponseSchema,
    );

    const allowance = BigInt(response.allowance);
    console.log('Allowance:', allowance.toString());

    return allowance;
  }

  private async getApproveTx({ amount, tokenAddress }: { amount: bigint; tokenAddress: string }) {
    return await this.call1inchAPI(
      '/approve/transaction',
      {
        amount: amount.toString(),
        tokenAddress,
      },
      approveTransactionResponseSchema,
    );
  }

  private async sendTransaction(
    account: PrivateKeyAccount,
    tx: { to: Hex; data: Hex; value: bigint },
  ): Promise<string> {
    try {
      return await this.walletClient.sendTransaction({
        account,
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
        chain: bsc,
        kzg: undefined,
      });
    } catch (err) {
      console.error('Transaction signing or broadcasting failed');
      console.error('Transaction data:', tx);
      throw err;
    }
  }
}
