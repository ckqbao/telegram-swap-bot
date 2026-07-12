# Multi-Chain Support (BNB / ETH / ARB) — Design

**Date:** 2026-07-12
**Status:** Approved

## Goal

Let the user switch the active chain (BNB Chain, Ethereum, Arbitrum One) from a
button in the bot's main menu, so tokens can be traded on any of the three —
e.g. Robinhood tokenized stocks on Arbitrum. BNB remains the default; existing
users are unaffected until they switch.

## Decisions

- **Chain scope:** per-user setting stored in `Preference`, applies to all
  actions until switched again (Maestro-style).
- **Chains at launch:** BNB (56), ETH (1), ARB (42161). Registry-driven so a
  new chain is one config entry.
- **RPCs:** built-in public defaults; optional env overrides
  `BSC_RPC_URL` / `ETH_RPC_URL` / `ARB_RPC_URL` (existing `EVM_RPC_URL` maps to
  the BSC entry for backward compatibility).
- **Buy amounts:** per-chain (native-unit presets differ wildly in USD value).
  Slippage and gas stay global.

## Architecture

### Chain registry — `src/common/constants/chains.ts`

Single source of truth keyed by `ChainKey = 'bnb' | 'eth' | 'arb'`:

```ts
{
  key, label,                 // 'bnb', 'BNB Chain'
  viemChain,                  // bsc | mainnet | arbitrum from viem/chains
  nativeSymbol, nativeDecimals,
  defaultRpcUrl, rpcEnvKey,
  defaultBuyAmounts,          // e.g. smaller presets on ETH
  explorer: { scan, dexscreenerSlug, dextoolsSlug, birdeyeSlug },
}
```

### Per-chain viem clients — `ChainClientService`

Replaces the fixed `VIEM_PUBLIC_CLIENT` singleton. Lives in `CommonModule`,
lazily creates and caches one extended viem public client per chain:
`getClient(chainKey)`. Existing multicall batching settings preserved.

### Selection flow

1. New `chain` field on `Preference` schema, default `'bnb'`.
2. Main menu gains a `⛓ Chain: BNB` button → chain-select keyboard
   (`BNB / ETH / ARB`, current one ✅) → tap updates preference, re-renders.
3. On each user action (paste token, buy, sell, refresh), the handler reads
   `preference.chain` (preference is already fetched for slippage) and passes
   the chain key down.
4. `msg_log` records the chain a token-info message was created on, so
   buy/sell buttons on older messages trade on the chain they were quoted on
   even if the user switched since.

## Service changes

- **OKX swap:** `SwapConfig` gains chain; wallet/provider built from
  `ChainClientService.getClient(chain)`. SDK network table already covers
  1/42161/56; the executor is chain-agnostic. Fee/referrer logic unchanged.
- **1inch services:** URLs are already `${baseUrl}/${chainId}/...`; public
  methods gain a `chainId` param instead of reading the fixed client /
  `MAIN_CHAIN_ID`. Cache keys already include chainId.
- **Native token:** `NATIVE_TOKEN` / `NATIVE_TOKEN_DECIMALS` constants replaced
  by registry lookups.
- **Links/captions:** explorer, dexscreener, dextools, birdeye links become
  chain-aware via registry slugs.
- **Preference:** `buyAmounts` becomes a per-chain map. Backward compatible:
  an existing flat array is treated as the BNB entry; other chains fall back
  to registry defaults.

## Out of scope (YAGNI)

- PCS (PancakeSwap) module stays BSC-only — not the active swap provider.
- Jupiter (Solana) untouched.
- No auto-detection of a token's chain; the user selects the chain explicitly.
