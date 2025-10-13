import { z } from 'zod';

export const tokenV1Schema = z.object({
  address: z.string(),
  created_at: z.string().datetime(),
  daily_volume: z.number().nullable(),
  decimals: z.number(),
  extensions: z.any(),
  freeze_authority: z.string().nullable(),
  logoURI: z.string().nullable(),
  mint_authority: z.string().nullable(),
  minted_at: z.string().datetime(),
  name: z.string(),
  permanent_delegate: z.string().nullable(),
  symbol: z.string(),
  tags: z.array(z.string()),
});

const statsSchema = z.object({
  priceChange: z.number().optional(),
  holderChange: z.number().optional(),
  liquidityChange: z.number().optional(),
  volumeChange: z.number().optional(),
  buyVolume: z.number().optional(),
  sellVolume: z.number().optional(),
  buyOrganicVolume: z.number().optional(),
  sellOrganicVolume: z.number().optional(),
  numBuys: z.number().optional(),
  numSells: z.number().optional(),
  numTraders: z.number().optional(),
  numOrganicBuyers: z.number().optional(),
  numNetBuyers: z.number().optional(),
});

export const tokenV2Schema = z.object({
  id: z.string().describe("The token's mint address"),
  name: z.string(),
  symbol: z.string(),
  icon: z.string().optional(),
  decimals: z.number(),
  twitter: z.string().optional(),
  telegram: z.string().optional(),
  website: z.string().optional(),
  dev: z.string().optional(),
  circSupply: z.number().optional(),
  totalSupply: z.number().optional(),
  tokenProgram: z.string(),
  launchpad: z.string().optional(),
  partnerConfig: z.string().optional(),
  graduatedPool: z.string().optional(),
  graduatedAt: z.string().optional(),
  holderCount: z.number().optional(),
  fdv: z.number().optional(),
  mcap: z.number().optional(),
  usdPrice: z.number().optional(),
  priceBlockId: z.number().optional(),
  liquidity: z.number().optional(),
  stats5m: statsSchema.optional(),
  stats1h: statsSchema.optional(),
  stats6h: statsSchema.optional(),
  stats24h: statsSchema.optional(),
  firstPool: z
    .object({
      id: z.string(),
      createdAt: z.string(),
    })
    .optional(),
  audit: z
    .object({
      isSus: z.boolean().optional(),
      mintAuthorityDisabled: z.boolean().optional(),
      freezeAuthorityDisabled: z.boolean().optional(),
      topHoldersPercentage: z.number().optional(),
      devBalancePercentage: z.number().optional(),
      devMigrations: z.number().optional(),
    })
    .optional(),
  organicScore: z.number(),
  organicScoreLabel: z.enum(['high', 'medium', 'low']),
  isVerified: z.boolean().optional(),
  cexes: z.string().array().optional(),
  tags: z.string().array().optional(),
  updatedAt: z.iso.datetime(),
});

export type TokenInfo = z.infer<typeof tokenV2Schema>;
