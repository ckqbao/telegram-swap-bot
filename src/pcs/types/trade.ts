import { z } from 'zod';
import { hexSchema } from '@/common/utils/zod-schema';

export const swapParametersSchema = z.object({
  tokenIn: hexSchema,
  tokenOut: hexSchema,
  amountIn: z.bigint(),
  slippage: z.number().min(0).max(100).default(0.5), // 0.5% default slippage
  deadline: z.number().optional(), // Unix timestamp in seconds
  recipient: hexSchema.optional(), // If not provided, uses sender address
});

export type SwapParameters = z.infer<typeof swapParametersSchema>;

export const swapResultSchema = z.object({
  txHash: hexSchema,
  amountIn: z.bigint(),
  amountOut: z.bigint(),
  tokenIn: hexSchema,
  tokenOut: hexSchema,
  gasUsed: z.bigint().optional(),
});

export type SwapResult = z.infer<typeof swapResultSchema>;
