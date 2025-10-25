import { z } from 'zod';
import { hexSchema } from '@/common/utils/zod-schema';

export const quoteParametersSchema = z.object({
  tokenIn: hexSchema,
  tokenOut: hexSchema,
  amountIn: z.bigint(),
});

export type QuoteParameters = z.infer<typeof quoteParametersSchema>;

export const routeStepSchema = z.object({
  poolAddress: hexSchema,
  tokenIn: hexSchema,
  tokenOut: hexSchema,
  fee: z.number(),
  type: z.enum(['v3', 'v2', 'stable']),
});

export type RouteStep = z.infer<typeof routeStepSchema>;

export const quoteResultSchema = z.object({
  amountOut: z.bigint(),
  priceImpact: z.number(), // Percentage
  route: z.array(routeStepSchema),
  gasEstimate: z.bigint().optional(),
});

export type QuoteResult = z.infer<typeof quoteResultSchema>;
