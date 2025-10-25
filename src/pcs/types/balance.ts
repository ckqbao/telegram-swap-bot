import { z } from 'zod';
import { hexSchema } from '@/common/utils/zod-schema';

export const balanceQuerySchema = z.object({
  token: hexSchema,
  address: hexSchema,
});

export type BalanceQuery = z.infer<typeof balanceQuerySchema>;

export const balanceResultSchema = z.object({
  token: hexSchema,
  address: hexSchema,
  balance: z.bigint(),
  decimals: z.number(),
  symbol: z.string().optional(),
  name: z.string().optional(),
});

export type BalanceResult = z.infer<typeof balanceResultSchema>;

export const multiBalanceQuerySchema = z.object({
  tokens: z.array(hexSchema),
  address: hexSchema,
});

export type MultiBalanceQuery = z.infer<typeof multiBalanceQuerySchema>;
