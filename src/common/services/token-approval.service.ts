import { Inject, Injectable, Logger } from '@nestjs/common';
import { erc20Abi, Hex } from 'viem';
import { bsc } from 'viem/chains';
import { ViemPublicClient } from '../providers';
import { VIEM_PUBLIC_CLIENT } from '../constants/provider.constant';
import { OnStatusUpdate } from '../interfaces/swap.interface';

type TokenApprovalParams = {
  tokenAddress: Hex;
  walletAddress: Hex;
  spenderAddress: Hex;
  requiredAmount: bigint;
};

@Injectable()
export class TokenApprovalService {
  private readonly logger = new Logger(TokenApprovalService.name);

  constructor(@Inject(VIEM_PUBLIC_CLIENT) private readonly viemPublicClient: ViemPublicClient) {}

  async approveIfNeeded(
    { tokenAddress, walletAddress, spenderAddress, requiredAmount }: TokenApprovalParams,
    onStatusUpdate?: OnStatusUpdate,
  ) {
    const approved = await this.getAllowance(tokenAddress, walletAddress, spenderAddress);

    if (!approved) {
      await onStatusUpdate?.('approving');
      await this.approve(tokenAddress, walletAddress, spenderAddress, requiredAmount);
      await onStatusUpdate?.('approved');
    }
  }

  private async getAllowance(tokenAddress: Hex, walletAddress: Hex, spenderAddress: Hex): Promise<bigint> {
    try {
      this.logger.log('Checking token allowance...');

      return await this.viemPublicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletAddress, spenderAddress],
      });
    } catch (error) {
      this.logger.error(`Failed to get allowance: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async approve(tokenAddress: Hex, walletAddress: Hex, spenderAddress: Hex, requiredAmount: bigint) {
    try {
      const hash = await this.viemPublicClient.writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress, requiredAmount],
        chain: bsc,
        account: walletAddress,
      });

      await this.viemPublicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

      this.logger.log(`Approval confirmed for token ${tokenAddress}: ${hash}`);
    } catch (error) {
      this.logger.error(`Failed to approve token ${tokenAddress}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
