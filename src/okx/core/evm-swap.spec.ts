import { EvmSwapExecutor } from './evm-swap';
import { ChainConfig, OKXConfig } from '@okx-dex/okx-dex-sdk';

function buildExecutor(chainId: string, getBlock: (tag: string) => Promise<{ baseFeePerGas: bigint | null } | null>) {
  const provider = { getBlock } as any;
  const wallet = { address: '0xabc', provider } as any;
  const config = { evm: { wallet } } as unknown as OKXConfig;
  const networkConfig = { id: chainId, explorer: 'https://example.com/tx' } as ChainConfig;
  return new EvmSwapExecutor(config, networkConfig) as any;
}

describe('EvmSwapExecutor gas price', () => {
  it('uses the fixed per-chain floor when the base fee is comfortably below it', async () => {
    const executor = buildExecutor('4663', async () => ({ baseFeePerGas: BigInt(100000000) }));
    await expect(executor.getGasPrice()).resolves.toBe(BigInt(120000000));
  });

  it('pads above the base fee when it approaches the fixed floor', async () => {
    // baseFee (120094000) is just above the 0.12 Gwei floor for chain 4663
    const executor = buildExecutor('4663', async () => ({ baseFeePerGas: BigInt(120094000) }));
    const gasPrice: bigint = await executor.getGasPrice();
    expect(gasPrice).toBeGreaterThan(BigInt(120094000));
  });

  it('falls back to the default fixed price for chains without an override', async () => {
    const executor = buildExecutor('56', async () => ({ baseFeePerGas: BigInt(50000000) }));
    await expect(executor.getGasPrice()).resolves.toBe(BigInt(150000000));
  });

  it('falls back to the fixed price when the provider reports no base fee', async () => {
    const executor = buildExecutor('4663', async () => ({ baseFeePerGas: null }));
    await expect(executor.getGasPrice()).resolves.toBe(BigInt(120000000));
  });
});
