import { Inject, Injectable, Logger } from '@nestjs/common';
import { Hex, PublicClient, PrivateKeyAccount, erc20Abi, encodeFunctionData } from 'viem';
import { bsc } from 'viem/chains';
import { PANCAKE_SMART_ROUTER_ADDRESS } from './pcs.constant';
import { VIEM_PUBLIC_CLIENT } from '@/common/constants/provider.constant';
import { OnStatusUpdate, SwapConfig } from '@/common/interfaces/swap.interface';
import { ViemPublicClient } from '@/common/providers';

@Injectable()
export class PcsTokenApprovalService {
  private readonly logger = new Logger(PcsTokenApprovalService.name);

  constructor(@Inject(VIEM_PUBLIC_CLIENT) private readonly publicClient: ViemPublicClient) {}

  /**
   * Check if token approval is needed and approve if necessary
   */
  async approveIfNeeded(
    account: PrivateKeyAccount,
    tokenAddress: Hex,
    amountToSwap: bigint,
    onStatusUpdate?: OnStatusUpdate,
    approvalStrategy: SwapConfig['approvalStrategy'] = 'unlimited',
    approvalMultiplier: number = 100,
  ): Promise<void> {
    const approved = await this.checkApproval(tokenAddress, account.address, amountToSwap);

    if (!approved) {
      await onStatusUpdate?.('approving');
      await this.approveToken(account, tokenAddress, amountToSwap, approvalStrategy, approvalMultiplier);
      await onStatusUpdate?.('approved');
    }
  }

  /**
   * Check if token approval is sufficient for the swap
   */
  async checkApproval(token: Hex, owner: Hex, amount: bigint): Promise<boolean> {
    try {
      const allowance = await this.publicClient.readContract({
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [owner, PANCAKE_SMART_ROUTER_ADDRESS],
      });

      const isApproved = allowance >= amount;

      this.logger.log(
        `Approval check for ${token}: ${isApproved ? 'Approved' : 'Needs approval'} (allowance: ${allowance.toString()}, required: ${amount.toString()})`,
      );

      return isApproved;
    } catch (error) {
      this.logger.error(`Failed to check approval: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Approve token for the Smart Router
   * Supports multiple approval strategies for security/convenience trade-offs
   */
  private async approveToken(
    account: PrivateKeyAccount,
    token: Hex,
    swapAmount: bigint,
    strategy: SwapConfig['approvalStrategy'] = 'unlimited',
    multiplier: number = 100,
  ): Promise<Hex> {
    try {
      // Calculate approval amount based on strategy
      let approvalAmount: bigint;
      let strategyDescription: string;

      switch (strategy) {
        case 'exact':
          // Safest: Only approve the exact amount needed
          approvalAmount = swapAmount;
          strategyDescription = `exact amount (${swapAmount.toString()})`;
          break;

        case 'multiple':
          // Balanced: Approve a multiple of swap amount (default 100x)
          approvalAmount = swapAmount * BigInt(multiplier);
          strategyDescription = `${multiplier}x swap amount (${approvalAmount.toString()})`;
          break;

        case 'unlimited':
        default:
          // Most convenient but riskiest: Unlimited approval
          approvalAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
          strategyDescription = 'unlimited (max uint256)';
          break;
      }

      this.logger.log(`Approving ${token} with ${strategyDescription} [strategy: ${strategy}]`);

      const approveTxHash = await this.publicClient.sendTransaction({
        account,
        to: token,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [PANCAKE_SMART_ROUTER_ADDRESS, approvalAmount],
        }),
        chain: bsc,
        kzg: undefined,
      });

      this.logger.log(`Approval transaction sent. Hash: ${approveTxHash}`);

      // Wait for approval transaction to be confirmed
      await this.publicClient.waitForTransactionReceipt({
        hash: approveTxHash,
        confirmations: 1,
      });

      this.logger.log(`Approval confirmed: ${approveTxHash}`);

      return approveTxHash;
    } catch (error) {
      this.logger.error(`Failed to approve token: ${error.message}`, error.stack);
      throw error;
    }
  }
}
