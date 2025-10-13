import z from 'zod';
import { hexSchema } from '@/common/utils/zod-schema';

export const approveTransactionResponseSchema = z.object({
  data: hexSchema,
  gasPrice: z.string(),
  to: hexSchema,
  value: z.coerce.bigint(),
});

export const swapTransactionSchema = z.object({
  from: z.string(),
  to: hexSchema,
  data: hexSchema,
  value: z.coerce.bigint(),
  gas: z.number(),
  gasPrice: z.string(),
});

export type ApproveTransactionResponse = z.infer<typeof approveTransactionResponseSchema>;
export type SwapTransaction = z.infer<typeof swapTransactionSchema>;
