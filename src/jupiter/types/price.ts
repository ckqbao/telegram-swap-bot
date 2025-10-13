import { z } from 'zod';

export const priceSchema = z.record(
  z.string(),
  z.object({
    blockId: z.number().nullable(),
    decimals: z.number(),
    usdPrice: z.number(),
    priceChange24h: z.number().nullable(),
  }),
);

export type Price = z.infer<typeof priceSchema>;
