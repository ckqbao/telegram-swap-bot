# Multi-Chain Support (BNB / ETH / ARB) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a per-user chain switcher (BNB Chain / Ethereum / Arbitrum One) to the Telegram swap bot so all token lookups, buys, and sells run on the selected chain.

**Architecture:** A chain registry (`src/common/constants/chains.ts`) is the single source of truth for the three chains. A `ChainClientService` lazily caches one viem client per chain. The user's selected chain lives on `Preference` (default `bnb`); each token-info message records its chain in `msg-logs` so buy/sell buttons trade on the chain they were quoted on. OKX swap + 1inch services take the chain as a parameter instead of reading fixed constants. Design doc: `docs/plans/2026-07-12-multi-chain-support-design.md`.

**Tech Stack:** NestJS 11, Telegraf (nestjs-telegraf), Mongoose, viem, OKX DEX SDK, 1inch REST APIs, Jest + ts-jest.

**Verification commands** (run from repo root):
- Typecheck: `yarn check`
- Tests: `yarn test`
- Lint: `yarn lint`

**Important repo facts for the implementer:**
- Path alias `@/*` → `src/*` (tsconfig). Jest does NOT map it yet — Task 1 fixes that.
- `PreferenceRepository.getByUserId` uses `.lean()`, and Mongoose **does not apply schema defaults on lean reads** — old documents will have `chain === undefined`. Always go through the `resolveChainKey` helper (Task 3), never read `preference.chain` directly.
- The active swap provider is `OkxSwapService` (bound to `SwapProviderService` in `telegram.module.ts`). The PCS (PancakeSwap) module and `1inch-classic-swap`/`1inch-fusion-swap` services are NOT active — leave them untouched; they keep compiling against the old BSC-only `VIEM_PUBLIC_CLIENT` provider, which we keep.
- The OKX SDK's network table in `src/okx/core/okx-dex.ts` already has entries for chains `1`, `42161`, `56` — no changes needed there. `BscSwapExecutor` is chain-agnostic despite its name (uses whatever provider the wallet carries).

---

### Task 1: Jest path-alias mapping

**Files:**
- Modify: `package.json` (jest section, ~line 83)

**Step 1: Add moduleNameMapper**

In the `"jest"` object in `package.json`, after `"rootDir": "src",` add:

```json
"moduleNameMapper": {
  "^@/(.*)$": "<rootDir>/$1"
},
```

**Step 2: Verify existing tests still run**

Run: `yarn test`
Expected: the existing `app.controller.spec.ts` passes (1 suite). If it errors on env parsing, note that `.env` must exist locally (it does for this project — the bot runs from it).

**Step 3: Commit**

```bash
git add package.json
git commit -m "test: map @/ path alias in jest"
```

---

### Task 2: Chain registry

**Files:**
- Create: `src/common/constants/chains.ts`
- Create: `src/common/constants/chains.spec.ts`
- Modify: `src/common/constants/index.ts` (re-export)

**Step 1: Write the failing test**

Create `src/common/constants/chains.spec.ts`:

```ts
import { CHAINS, CHAIN_KEYS, DEFAULT_CHAIN_KEY, getChain } from './chains';

describe('chain registry', () => {
  it('supports bnb, eth and arb', () => {
    expect(CHAIN_KEYS).toEqual(['bnb', 'eth', 'arb']);
  });

  it('defaults to bnb', () => {
    expect(DEFAULT_CHAIN_KEY).toBe('bnb');
  });

  it('maps to the right chain ids', () => {
    expect(getChain('bnb').viemChain.id).toBe(56);
    expect(getChain('eth').viemChain.id).toBe(1);
    expect(getChain('arb').viemChain.id).toBe(42161);
  });

  it('uses the ETH symbol on arbitrum', () => {
    expect(getChain('arb').nativeSymbol).toBe('ETH');
    expect(getChain('bnb').nativeSymbol).toBe('BNB');
  });

  it('has smaller default buy amounts on eth/arb than bnb', () => {
    expect(Math.max(...getChain('eth').defaultBuyAmounts)).toBeLessThan(
      Math.max(...getChain('bnb').defaultBuyAmounts),
    );
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn test chains.spec`
Expected: FAIL — cannot find module `./chains`.

**Step 3: Write the registry**

Create `src/common/constants/chains.ts`. **Do not import `@/env/env` here** — the registry stays pure so tests don't depend on env vars; RPC URL resolution happens in `ChainClientService` (Task 4).

```ts
import { Chain } from 'viem';
import { arbitrum, bsc, mainnet } from 'viem/chains';
import { DEFAULT_BUY_AMOUNTS } from '.';

export const CHAIN_KEYS = ['bnb', 'eth', 'arb'] as const;

export type ChainKey = (typeof CHAIN_KEYS)[number];

export type ChainInfo = {
  key: ChainKey;
  label: string;
  viemChain: Chain;
  nativeSymbol: string;
  nativeDecimals: number;
  defaultRpcUrl: string;
  rpcEnvKey: 'EVM_RPC_URL' | 'ETH_RPC_URL' | 'ARB_RPC_URL';
  defaultBuyAmounts: number[];
  explorer: {
    scanUrl: string; // e.g. https://bscscan.com
    dexscreenerSlug: string;
    dextoolsSlug: string;
    birdeyeSlug: string;
  };
};

const ETH_BUY_AMOUNTS = [0.005, 0.01, 0.02, 0.03, 0.05, 0.08];

export const CHAINS: Record<ChainKey, ChainInfo> = {
  bnb: {
    key: 'bnb',
    label: 'BNB Chain',
    viemChain: bsc,
    nativeSymbol: bsc.nativeCurrency.symbol,
    nativeDecimals: bsc.nativeCurrency.decimals,
    defaultRpcUrl: 'https://bsc-dataseed1.bnbchain.org',
    rpcEnvKey: 'EVM_RPC_URL',
    defaultBuyAmounts: DEFAULT_BUY_AMOUNTS,
    explorer: {
      scanUrl: 'https://bscscan.com',
      dexscreenerSlug: 'bsc',
      dextoolsSlug: 'bnb',
      birdeyeSlug: 'bsc',
    },
  },
  eth: {
    key: 'eth',
    label: 'Ethereum',
    viemChain: mainnet,
    nativeSymbol: mainnet.nativeCurrency.symbol,
    nativeDecimals: mainnet.nativeCurrency.decimals,
    defaultRpcUrl: 'https://ethereum-rpc.publicnode.com',
    rpcEnvKey: 'ETH_RPC_URL',
    defaultBuyAmounts: ETH_BUY_AMOUNTS,
    explorer: {
      scanUrl: 'https://etherscan.io',
      dexscreenerSlug: 'ethereum',
      dextoolsSlug: 'ether',
      birdeyeSlug: 'ethereum',
    },
  },
  arb: {
    key: 'arb',
    label: 'Arbitrum',
    viemChain: arbitrum,
    nativeSymbol: arbitrum.nativeCurrency.symbol,
    nativeDecimals: arbitrum.nativeCurrency.decimals,
    defaultRpcUrl: 'https://arb1.arbitrum.io/rpc',
    rpcEnvKey: 'ARB_RPC_URL',
    defaultBuyAmounts: ETH_BUY_AMOUNTS,
    explorer: {
      scanUrl: 'https://arbiscan.io',
      dexscreenerSlug: 'arbitrum',
      dextoolsSlug: 'arbitrum',
      birdeyeSlug: 'arbitrum',
    },
  },
};

export const DEFAULT_CHAIN_KEY: ChainKey = 'bnb';

export function getChain(key: ChainKey): ChainInfo {
  return CHAINS[key];
}

export function isChainKey(value: string): value is ChainKey {
  return (CHAIN_KEYS as readonly string[]).includes(value);
}
```

Append to `src/common/constants/index.ts`:

```ts
export * from './chains';
```

⚠️ `chains.ts` imports `DEFAULT_BUY_AMOUNTS` from `.` (index) and index re-exports chains — circular but safe for value initialization order here since `DEFAULT_BUY_AMOUNTS` is declared before the re-export line. If jest/ts complains about the cycle, move `DEFAULT_BUY_AMOUNTS` into `chains.ts` and re-export it from index instead.

**Step 4: Run test to verify it passes**

Run: `yarn test chains.spec`
Expected: PASS (5 tests). Also run `yarn check` — no type errors.

**Step 5: Commit**

```bash
git add src/common/constants/chains.ts src/common/constants/chains.spec.ts src/common/constants/index.ts
git commit -m "feat: add chain registry for bnb/eth/arb"
```

---

### Task 3: Preference chain + per-chain buy amounts (schema, helpers, repository)

**Files:**
- Modify: `src/database/schema/preference.schema.ts`
- Modify: `src/database/repository/preference.repository.ts`
- Create: `src/common/utils/preference.ts`
- Create: `src/common/utils/preference.spec.ts`
- Modify: `src/common/utils/index.ts` (re-export; check the file — it re-exports the other utils)

**Step 1: Write the failing test**

Create `src/common/utils/preference.spec.ts`:

```ts
import { resolveBuyAmounts, resolveChainKey } from './preference';
import { CHAINS, DEFAULT_BUY_AMOUNTS } from '@/common/constants';

describe('resolveChainKey', () => {
  it('falls back to bnb when chain is missing (lean docs have no defaults)', () => {
    expect(resolveChainKey({})).toBe('bnb');
    expect(resolveChainKey({ chain: undefined })).toBe('bnb');
  });

  it('returns the stored chain', () => {
    expect(resolveChainKey({ chain: 'arb' })).toBe('arb');
  });

  it('falls back to bnb on an unknown stored value', () => {
    expect(resolveChainKey({ chain: 'dogechain' })).toBe('bnb');
  });
});

describe('resolveBuyAmounts', () => {
  it('prefers the per-chain amounts', () => {
    const pref = { buyAmounts: [1, 2], buyAmountsByChain: { eth: [0.01, 0.02] } };
    expect(resolveBuyAmounts(pref, 'eth')).toEqual([0.01, 0.02]);
  });

  it('treats the legacy flat array as the bnb entry', () => {
    const pref = { buyAmounts: [1, 2] };
    expect(resolveBuyAmounts(pref, 'bnb')).toEqual([1, 2]);
  });

  it('does NOT leak legacy bnb amounts onto other chains', () => {
    const pref = { buyAmounts: [1, 2] };
    expect(resolveBuyAmounts(pref, 'eth')).toEqual(CHAINS.eth.defaultBuyAmounts);
  });

  it('falls back to registry defaults when nothing is stored', () => {
    expect(resolveBuyAmounts({}, 'bnb')).toEqual(DEFAULT_BUY_AMOUNTS);
    expect(resolveBuyAmounts({}, 'arb')).toEqual(CHAINS.arb.defaultBuyAmounts);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn test preference.spec`
Expected: FAIL — cannot find module `./preference`.

**Step 3: Write helpers + schema + repository**

Create `src/common/utils/preference.ts` (structural param types keep it decoupled from the Mongoose schema):

```ts
import { ChainKey, DEFAULT_CHAIN_KEY, getChain, isChainKey } from '@/common/constants';

type PreferenceLike = {
  chain?: string;
  buyAmounts?: number[];
  buyAmountsByChain?: Partial<Record<ChainKey, number[]>>;
};

export function resolveChainKey(preference: PreferenceLike): ChainKey {
  const { chain } = preference;
  if (chain && isChainKey(chain)) return chain;
  return DEFAULT_CHAIN_KEY;
}

export function resolveBuyAmounts(preference: PreferenceLike, chainKey: ChainKey): number[] {
  const perChain = preference.buyAmountsByChain?.[chainKey];
  if (perChain?.length) return perChain;
  if (chainKey === DEFAULT_CHAIN_KEY && preference.buyAmounts?.length) return preference.buyAmounts;
  return getChain(chainKey).defaultBuyAmounts;
}
```

Re-export from `src/common/utils/index.ts` (add `export * from './preference';` alongside the existing exports).

In `src/database/schema/preference.schema.ts`, add two props to the class (keep existing ones):

```ts
import { ChainKey, DEFAULT_CHAIN_KEY } from '@/common/constants';

  @Prop({ type: String, default: DEFAULT_CHAIN_KEY })
  chain: ChainKey;

  @Prop({ type: Object, default: {} })
  buyAmountsByChain: Partial<Record<ChainKey, number[]>>;
```

In `src/database/repository/preference.repository.ts`, add two methods and make `setBuyAmounts` chain-aware (replace the old `setBuyAmounts`):

```ts
  async setChain(userId: number, chain: ChainKey) {
    await this.getByUserId(userId);
    await this.preferenceModel.updateOne({ userId }, { chain });
  }

  async setBuyAmounts(userId: number, chain: ChainKey, buyAmounts: number[]) {
    await this.getByUserId(userId);
    const update: Record<string, unknown> = { [`buyAmountsByChain.${chain}`]: buyAmounts };
    if (chain === DEFAULT_CHAIN_KEY) update.buyAmounts = buyAmounts; // keep legacy field in sync
    await this.preferenceModel.updateOne({ userId }, update);
  }
```

(Imports: `ChainKey, DEFAULT_CHAIN_KEY` from `@/common/constants`.)

The only caller of `setBuyAmounts` is `src/telegram/scenes/token/token-settings.scene.ts:96`. Update it:

```ts
const preference = await this.preferenceRepository.getByUserId(user.id);
await this.preferenceRepository.setBuyAmounts(user.id, resolveChainKey(preference), amounts);
```

(Import `resolveChainKey` from `@/common/utils`.)

**Step 4: Run tests + typecheck**

Run: `yarn test preference.spec && yarn check`
Expected: PASS; no type errors.

**Step 5: Commit**

```bash
git add src/common/utils/preference.ts src/common/utils/preference.spec.ts src/common/utils/index.ts src/database/schema/preference.schema.ts src/database/repository/preference.repository.ts src/telegram/scenes/token/token-settings.scene.ts
git commit -m "feat: per-user chain preference and per-chain buy amounts"
```

---

### Task 4: Env vars + ChainClientService

**Files:**
- Modify: `src/env/env.ts`
- Create: `src/common/services/chain-client.service.ts`
- Modify: `src/common/common.module.ts`

**Step 1: Add optional RPC env overrides**

In `src/env/env.ts`, inside `envSchema`, after the `EVM_RPC_URL` line add:

```ts
  ETH_RPC_URL: z.string().optional(),
  ARB_RPC_URL: z.string().optional(),
```

(`EVM_RPC_URL` stays as-is — it is the BSC override, keeping existing `.env` files working.)

**Step 2: Create ChainClientService**

Create `src/common/services/chain-client.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { createPublicClient, http } from 'viem';
import { env } from '@/env/env';
import { ChainKey, getChain } from '../constants';
import { ViemPublicClient } from '../providers/viem-public-client.provider';
import { walletActions } from 'viem';

@Injectable()
export class ChainClientService {
  private readonly clients = new Map<ChainKey, ViemPublicClient>();

  getClient(chainKey: ChainKey): ViemPublicClient {
    const existing = this.clients.get(chainKey);
    if (existing) return existing;

    const chain = getChain(chainKey);
    const rpcUrl = env[chain.rpcEnvKey] ?? chain.defaultRpcUrl;
    const client = createPublicClient({
      chain: chain.viemChain,
      transport: http(rpcUrl),
      batch: {
        multicall: {
          batchSize: 1024 * 200,
        },
      },
    }).extend(walletActions);

    this.clients.set(chainKey, client);
    return client;
  }
}
```

Note: `ViemPublicClient` is `ReturnType<typeof extendClient>` in the provider file — if the type doesn't line up exactly (viem generics are finicky), export the `extendClient` helper from `viem-public-client.provider.ts` and reuse it here rather than fighting the types.

**Step 3: Register in CommonModule**

In `src/common/common.module.ts` add `ChainClientService` to both `providers` and `exports` (keep `viemPublicClientProvider` — PCS and the inactive 1inch swap services still use it).

**Step 4: Typecheck**

Run: `yarn check`
Expected: no errors.

**Step 5: Commit**

```bash
git add src/env/env.ts src/common/services/chain-client.service.ts src/common/common.module.ts
git commit -m "feat: per-chain viem clients with rpc env overrides"
```

---

### Task 5: Chain-aware explorer links

**Files:**
- Modify: `src/common/utils/links.ts`
- Create: `src/common/utils/links.spec.ts`

**Step 1: Write the failing test**

```ts
import { birdeyeLink, contractLink, dexscreenerLink, dextoolLink } from './links';

describe('chain-aware links', () => {
  const addr = '0x1234';

  it('builds bnb links (default behavior preserved)', () => {
    expect(contractLink(addr, 'bnb')).toContain('https://bscscan.com/token/0x1234');
    expect(dexscreenerLink(addr, 'bnb')).toContain('dexscreener.com/bsc/0x1234');
  });

  it('builds arbitrum links', () => {
    expect(contractLink(addr, 'arb')).toContain('https://arbiscan.io/token/0x1234');
    expect(dexscreenerLink(addr, 'arb')).toContain('dexscreener.com/arbitrum/0x1234');
    expect(dextoolLink(addr, 'arb')).toContain('dextools.io/app/en/arbitrum/pair-explorer/0x1234');
    expect(birdeyeLink(addr, 'arb')).toContain('birdeye.so/arbitrum/token/0x1234');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn test links.spec`
Expected: FAIL — functions don't accept a second argument (TS error).

**Step 3: Rewrite links.ts**

```ts
import { ChainKey, getChain } from '@/common/constants';

export const contractLink = (tokenAddress: string, chainKey: ChainKey) => {
  return `<a href="${getChain(chainKey).explorer.scanUrl}/token/${tokenAddress}">Contract</a>`;
};

export const birdeyeLink = (tokenAddress: string, chainKey: ChainKey) => {
  return `<a href="https://birdeye.so/${getChain(chainKey).explorer.birdeyeSlug}/token/${tokenAddress}">Birdeye</a>`;
};

export const dextoolLink = (tokenAddress: string, chainKey: ChainKey) => {
  return `<a href="https://www.dextools.io/app/en/${getChain(chainKey).explorer.dextoolsSlug}/pair-explorer/${tokenAddress}">Dextools</a>`;
};

export const dexscreenerLink = (tokenAddress: string, chainKey: ChainKey) => {
  return `<a href="https://dexscreener.com/${getChain(chainKey).explorer.dexscreenerSlug}/${tokenAddress}">Dexscreener</a>`;
};
```

The only caller is `tokenInfoCaption` in `src/telegram/captions/token.caption.ts` — it gets the chain param in Task 8; for now make it compile by passing a hardcoded `'bnb'` (Task 8 replaces it) OR do Tasks 5+8 in one commit if preferred. Simplest: pass `'bnb'` now with no comment needed.

**Step 4: Run tests + typecheck**

Run: `yarn test links.spec && yarn check`
Expected: PASS; no type errors.

**Step 5: Commit**

```bash
git add src/common/utils/links.ts src/common/utils/links.spec.ts src/telegram/captions/token.caption.ts
git commit -m "feat: chain-aware explorer links"
```

---

### Task 6: 1inch services take chainId

**Files:**
- Modify: `src/1inch/1inch-token.service.ts` (`getTokenInfo`, `getTokensInfo`)
- Modify: `src/1inch/1inch-balance.service.ts` (`getTokenBalances`)
- Modify: `src/1inch/1inch-spot-price.service.ts` (`getTokenPrice`)
- Modify: `src/1inch/1inch-token-details.service.ts` (`getTokenDetails`, `getTokenMarketCap`)

No unit tests here (thin fetch wrappers); `yarn check` is the gate, callers are updated in Tasks 7–8.

**Step 1: Add a `chainId: number` parameter to each method**

Pattern (same in all four services): add `chainId: number` as the **last** parameter, delete the `MAIN_CHAIN_ID` import, and use the parameter where `MAIN_CHAIN_ID` was used. E.g. in `1inch-token.service.ts`:

```ts
async getTokenInfo(address: Hex, chainId: number): Promise<TokenInfo> {
  const cacheKey = `token:${chainId}:${address.toLowerCase()}`;
  ...
```

Cache keys already include `chainId` — no cache invalidation needed.

In `1inch-balance.service.ts` the signature becomes `getTokenBalances(tokens: Hex[], privateKey: Hex, chainId: number)`.

**Step 2: Update callers so it compiles**

Callers (all get the real chain in Tasks 7–8; for now thread `getChain(DEFAULT_CHAIN_KEY).viemChain.id` ONLY if you want intermediate commits to typecheck — otherwise do Tasks 6–8 as one commit). Recommended: proceed straight to Tasks 7–8 and commit together. Callers:
- `src/telegram/swap.service.ts` (3 call sites)
- `src/telegram/token.service.ts` (4 call sites)

**Step 3: Typecheck**

Run: `yarn check` — after Tasks 7–8 if committing together.

---

### Task 7: SwapConfig + OkxSwapService chain support

**Files:**
- Modify: `src/common/interfaces/swap.interface.ts`
- Modify: `src/okx/okx-swap.service.ts`
- Modify: `src/okx/okx.module.ts` (check: `OkxSwapService` must be able to inject `ChainClientService`, so `OkxModule` must import `CommonModule` — it likely already does for `VIEM_PUBLIC_CLIENT`; verify)

**Step 1: Add `chain` to SwapConfig**

In `src/common/interfaces/swap.interface.ts`:

```ts
import { ChainKey } from '@/common/constants';

export type SwapConfig = {
  privateKey: string;
  chain: ChainKey;          // ← new
  fromTokenAddress: Hex;
  ...
```

**Step 2: Use per-chain client in OkxSwapService**

Replace the `VIEM_PUBLIC_CLIENT` injection with `ChainClientService`, resolve the client per swap, and derive `chainId` from the config chain (this also fixes `approveIfNeeded`, which wrongly used the fixed `MAIN_CHAIN_ID`):

```ts
constructor(private readonly chainClientService: ChainClientService) {}

async performSwap(config: SwapConfig, onStatusUpdate?: OnStatusUpdate) {
  const { amountToSwap, chain, privateKey, fromTokenAddress, fromTokenDecimals, toTokenAddress, slippage } = config;

  const client = this.chainClientService.getClient(chain);
  const { evmWallet, okxClient } = this.initializeOkxClient(privateKey, client);
  const chainId = `${getChain(chain).viemChain.id}`;
  const isNativeSwap = fromTokenAddress === this.nativeTokenAddress;

  if (!isNativeSwap) {
    await this.approveIfNeeded(okxClient, chainId, fromTokenAddress, fromTokenDecimals, amountToSwap, onStatusUpdate);
  }
  ...
```

- `approveIfNeeded` gains a `chainId: string` param, drops the `MAIN_CHAIN_ID` import.
- `initializeOkxClient(privateKey: string, client: ViemPublicClient)` passes `getEthersProvider(client)`.
- Remove now-unused imports (`Inject`, `VIEM_PUBLIC_CLIENT`, `MAIN_CHAIN_ID`, `ViemPublicClient` type import stays if used in the method signature).

**Step 3: Typecheck**

Run: `yarn check` — swap.service.ts call sites now fail; fixed in Task 8. (Commit Tasks 6–8 together.)

---

### Task 8: Thread chain through SwapService, TokenService, captions, msg-logs

**Files:**
- Modify: `src/database/schema/msg-log.schema.ts`
- Modify: `src/database/dto/msg-log.dto.ts` (add `chain` to the create DTO — inspect the file, mirror existing style)
- Modify: `src/database/repository/msg-log.repository.ts`
- Modify: `src/telegram/swap.service.ts`
- Modify: `src/telegram/token.service.ts`
- Modify: `src/telegram/captions/token.caption.ts`
- Modify: `src/telegram/keyboards/token.keyboards.ts`
- Modify: `src/telegram/use-cases/process-callback-query.use-case.ts`
- Modify: `src/telegram/use-cases/process-reply-message.use-case.ts`

**Step 1: Record the chain on msg-logs**

`msg-log.schema.ts` — add:

```ts
  @Prop({ type: String, default: DEFAULT_CHAIN_KEY })
  chain: ChainKey;
```

`msg-log.repository.ts` — add a method returning the full trade context (old lean docs may lack `chain`, so normalize):

```ts
  async getTokenTrade(chatId: number, msgId: number, username: string = '') {
    const msgLog = await this.msgLogModel.findOne({ chatId, msgId, username });
    if (!msgLog || !isAddress(msgLog.tokenAddress)) throw new Error('Token address not found');
    return { tokenAddress: msgLog.tokenAddress, chain: msgLog.chain ?? DEFAULT_CHAIN_KEY };
  }
```

Keep `getTokenAddress` if other callers remain; delete it if all callers migrate (check with grep — expected callers: process-callback-query.use-case only).

**Step 2: SwapService methods take a chain**

`swap.service.ts` — every public method gains `chain: ChainKey`; native symbol/decimals come from the registry; balances/token-info calls pass the viem chain id:

- `approveToken(msg, userId)` — resolves chain itself from the msgLog: it already loads `msgLog`; use `msgLog.chain ?? DEFAULT_CHAIN_KEY`. Pass `chain` into `performSwap` config and `chainId` into `getTokenInfo`.
- `buyToken(chatId, tokenAddress, amount, userId, chain: ChainKey)`:
  - `const { nativeSymbol, nativeDecimals, viemChain } = getChain(chain);`
  - `fromTokenDecimals: nativeDecimals`, config gains `chain`,
  - captions: `swapSuccessCaption(amount, nativeSymbol, 'buy', ...)` / `swapFailureCaption(amount, nativeSymbol, 'buy')`.
- `sellToken(chatId, tokenAddress, percent, userId, chain: ChainKey)`:
  - `getTokenInfo(tokenAddress, viemChain.id)`, `getTokenBalances([tokenAddress], privateKey, viemChain.id)`, config gains `chain`.
- Remove the `NATIVE_TOKEN, NATIVE_TOKEN_DECIMALS` import.

**Step 3: TokenService resolves the user's chain and stores it**

`token.service.ts`:

- `prepareTokenInfoContext(tokenAddress, user, chainKey: ChainKey)`:
  - `const chain = getChain(chainKey); const chainId = chain.viemChain.id;`
  - pass `chainId` to `getTokenBalances`, `getTokenInfo`, `getTokenPrice`, `getTokenDetails/getTokenMarketCap`,
  - `walletBalance` uses `chain.nativeDecimals` / `chain.nativeSymbol`,
  - caption call passes `chainKey` (Step 4), keyboard resolves buy amounts per chain: `resolveBuyAmounts(preference, chainKey)` and passes `nativeSymbol` for the custom-buy label.
- `getTokenInfo(chatId, tokenAddress, user)`: resolve `chainKey` from the user's preference (`resolveChainKey(await preferenceRepository.getByUserId(user.id))`) — note `prepareTokenInfoContext` also fetches the preference; restructure so the preference is fetched once and both the chain and buy amounts come from it. Store the chain on the msg log: `createMsgLog({ ..., chain: chainKey })`.
- `refreshTokenInfo(chatId, msgId, user)`: use `msgLogRepository.getTokenTrade(...)` and refresh with the **msg-log's** chain (the message keeps the chain it was quoted on).

**Step 4: Captions + keyboard**

`token.caption.ts`:
- `tokenInfoCaption(token, wallet, walletBalance, chainKey: ChainKey)` — pass `chainKey` to the four link helpers and add a chain line to the caption body, e.g. after the Market Cap line: `⛓ Chain: <b>${getChain(chainKey).label}</b>\n`.
- `buyCustomCaption(nativeSymbol: string)` → `⚙️ Buy X ${nativeSymbol}\n\n<i>Enter ${nativeSymbol} Value in format "0.05"</i>`.

`token.keyboards.ts`:
- `tokenInfoKeyboard({ buyAmounts, slippage, nativeSymbol }: { buyAmounts?: number[]; slippage: number; nativeSymbol: string })` — the custom-buy button label becomes `` `X ${nativeSymbol}` `` (callback unchanged: `buy-custom`).

**Step 5: Use-cases pass the msg-log chain**

`process-callback-query.use-case.ts`:
- Replace the buy-amount membership check (which breaks when presets differ per chain / message predates a preset change) with a numeric parse:

```ts
if (data.startsWith('buy-') && data !== tokenButtons.buyCustom.callback) {
  const amount = Number(data.slice('buy-'.length));
  if (Number.isFinite(amount) && amount > 0) {
    const { tokenAddress, chain } = await this.msgLogRepository.getTokenTrade(
      message.chat.id, message.message_id, user.username,
    );
    await this.swapService.buyToken(message.chat.id, tokenAddress, `${amount}`, user.id, chain);
    return;
  }
}
```

- Sell cases: use `getTokenTrade` and pass `chain` to `sellToken`.
- `buyCustomCaption()` call site: fetch the trade's chain → `buyCustomCaption(getChain(chain).nativeSymbol)`. The captions map is built before the switch; restructure so the buy-custom caption is only computed when needed (it now requires a msg-log lookup via `message.message_id`).
- Remove the now-unused `DEFAULT_BUY_AMOUNTS` import and `buyAmounts` variable if nothing else uses them.

`process-reply-message.use-case.ts`:
- `buyCustom`/`sellCustom` already load `msgLog` — pass `msgLog.chain ?? DEFAULT_CHAIN_KEY` into `buyToken`/`sellToken`.

**Step 6: Typecheck + full test run + lint**

Run: `yarn check && yarn test && yarn lint`
Expected: all green.

**Step 7: Commit (Tasks 6+7+8 together)**

```bash
git add -A src
git commit -m "feat: thread selected chain through swaps, token info and captions"
```

---

### Task 9: Chain switcher button in the main menu

**Files:**
- Create: `src/telegram/buttons/chain.buttons.ts`
- Modify: `src/telegram/keyboards/main.keyboard.ts`
- Modify: `src/telegram/scenes/main.scene.ts`

**Step 1: Buttons + keyboards**

`src/telegram/buttons/chain.buttons.ts`:

```ts
export const chainButtons = {
  chainSelect: {
    label: '⛓ Chain',
    callback: 'chain-select',
  },
  setChainPrefix: 'set-chain-',
};
```

`main.keyboard.ts` — `mainKeyboard` takes the current chain and shows it; add a chain-select keyboard:

```ts
import { ChainKey, CHAIN_KEYS, getChain } from '@/common/constants';
import { chainButtons } from '../buttons/chain.buttons';

export function mainKeyboard(chainKey: ChainKey): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`⛓ Chain: ${getChain(chainKey).label}`, chainButtons.chainSelect.callback)],
    [Markup.button.callback(tokenButtons.tokenSettings.label, tokenButtons.tokenSettings.callback)],
    [Markup.button.callback(walletButtons.wallets.label, walletButtons.wallets.callback)],
    ...closeKeyboard().reply_markup.inline_keyboard,
  ]);
}

export function chainSelectKeyboard(current: ChainKey): Markup.Markup<InlineKeyboardMarkup> {
  return Markup.inlineKeyboard([
    CHAIN_KEYS.map((key) =>
      Markup.button.callback(
        `${key === current ? '✅ ' : ''}${getChain(key).label}`,
        `${chainButtons.setChainPrefix}${key}`,
      ),
    ),
    ...closeKeyboard().reply_markup.inline_keyboard,
  ]);
}
```

**Step 2: MainScene actions**

`main.scene.ts` — inject `PreferenceRepository`, pass the chain on enter, add two actions:

```ts
@Scene(SceneEnum.MAIN_SCENE)
export class MainScene {
  constructor(private readonly preferenceRepository: PreferenceRepository) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Context, @CtxUser() user: User) {
    const preference = await this.preferenceRepository.getByUserId(user.id);
    await replyWithInlineKeyboardMenu(ctx, startCaption(), mainKeyboard(resolveChainKey(preference)));
  }

  @Action(chainButtons.chainSelect.callback)
  async selectChain(@Ctx() ctx: Context, @CtxUser() user: User) {
    const preference = await this.preferenceRepository.getByUserId(user.id);
    await ctx.editMessageReplyMarkup(chainSelectKeyboard(resolveChainKey(preference)).reply_markup);
  }

  @Action(new RegExp(`^${chainButtons.setChainPrefix}(bnb|eth|arb)$`))
  async setChain(@Ctx() ctx: Context, @CtxUser() user: User) {
    const data = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
    const chainKey = data.slice(chainButtons.setChainPrefix.length);
    if (!isChainKey(chainKey)) return;
    await this.preferenceRepository.setChain(user.id, chainKey);
    await ctx.editMessageReplyMarkup(mainKeyboard(chainKey).reply_markup);
    await ctx.answerCbQuery(`Chain set to ${getChain(chainKey).label}`);
  }
  ...
```

Notes for the implementer:
- `@CtxUser()` decorator exists at `src/telegram/decorator/context-user.decorator.ts` (see usage in `token-settings.scene.ts`).
- Check how other scenes read callback data — `@CtxDataQuery()` decorator is the house style; prefer it over casting `ctx.callbackQuery`.
- Check whether other keyboards regenerate the main menu (`grep -rn "mainKeyboard(" src`) and update all call sites with the chain arg.

**Step 3: Typecheck + tests + lint**

Run: `yarn check && yarn test && yarn lint`
Expected: all green.

**Step 4: Commit**

```bash
git add src/telegram
git commit -m "feat: chain switcher button in main menu"
```

---

### Task 10: End-to-end verification (manual, REQUIRED before calling it done)

REQUIRED SUB-SKILL: superpowers:verification-before-completion.

**Step 1: Build + start**

Run: `yarn build && yarn dev` (needs the local `.env` with real keys; it's the user's live-ish bot — do NOT execute real buys with large amounts).

**Step 2: In Telegram, verify:**

1. `/start` → main menu shows `⛓ Chain: BNB Chain`.
2. Tap it → three chain buttons, BNB check-marked. Pick `Arbitrum` → menu re-renders with `⛓ Chain: Arbitrum`, toast confirms.
3. Paste an Arbitrum token address (e.g. ARB token `0x912CE59144191C1204E64559FE8253a0e49E6548`) → token info shows price/market cap, `⛓ Chain: Arbitrum` line, links point to arbiscan/dexscreener-arbitrum, buy buttons show the smaller ETH presets, custom button says `X ETH`.
4. Switch back to BNB Chain → paste a BSC token → everything reads BNB as before (regression check).
5. Old messages: a token message quoted on ARB must still sell on ARB after switching the preference to BNB (msg-log chain pinning).
6. Optional (real funds, tiny amount, user's call): a small buy+sell on Arbitrum to confirm OKX executes there.

**Step 3: Final commit if fixes were needed; report results honestly.**
