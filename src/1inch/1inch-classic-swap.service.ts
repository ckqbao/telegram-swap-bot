import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Hex, parseUnits, PrivateKeyAccount } from 'viem';
import { nonceManager, privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import z from 'zod';
import { buildQueryURL } from '@/common/utils/url';
import { ViemPublicClient } from '@/common/providers';
import { VIEM_PUBLIC_CLIENT } from '@/common/constants/provider.constant';
import { Swap, SwapConfig } from '@/common/interfaces/swap.interface';
import { TokenApprovalService } from '@/common/services/token-approval.service';
import { env } from '@/env/env';
import { approveTransactionResponseSchema } from './types/transaction';
import { swapResponseSchema } from './types/swap';
import { ONE_INCH_NATIVE_TOKEN_ADDRESS } from './1inch.constant';

@Injectable()
export class OneInchClassicSwapService implements Swap {
  private readonly logger = new Logger(OneInchClassicSwapService.name);
  private baseUrl = `${env.ONE_INCH_BASE_URL}/swap/v6.1`;
  readonly nativeTokenAddress = ONE_INCH_NATIVE_TOKEN_ADDRESS;

  constructor(
    @Inject(VIEM_PUBLIC_CLIENT) private readonly viemPublicClient: ViemPublicClient,
    private readonly tokenApprovalService: TokenApprovalService,
  ) {}

  async performSwap(
    config: SwapConfig,
    onStatusUpdate?: (status: 'approving' | 'approved' | 'swapping') => Promise<void>,
  ): Promise<void> {
    const { amountToSwap, fromTokenAddress, fromTokenDecimals, toTokenAddress, slippage } = config;
    const account = privateKeyToAccount(config.privateKey as Hex, { nonceManager });

    const amount = parseUnits(amountToSwap, fromTokenDecimals);

    const swapParams = {
      src: fromTokenAddress,
      dst: toTokenAddress,
      amount: amount.toString(),
      from: account.address,
      slippage: slippage.toString(),
      disableEstimate: 'false',
      allowPartialFill: 'false',
      fee: '0',
    };

    await this.tokenApprovalService.approveIfNeeded(
      {
        tokenAddress: swapParams.src,
        walletAddress: account.address,
        spenderAddress: swapParams.from,
        requiredAmount: amount,
      },
      onStatusUpdate,
    );

    await onStatusUpdate?.('swapping');
    const { tx } = await this.call1inchAPI('/swap', swapParams, swapResponseSchema);

    const txHash = await this.sendTransaction(account, tx);
    console.log('Swap transaction sent. Hash:', txHash);
  }

  private async call1inchAPI<T>(endpoint: string, queryParams: Record<string, string>, schema: z.ZodSchema<T>) {
    const chainId = await this.viemPublicClient.getChainId();
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
      return await this.viemPublicClient.sendTransaction({
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
