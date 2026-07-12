import dayjs from 'dayjs';
import { ChainKey, getChain } from '@/common/constants';
import {
  birdeyeLink,
  contractLink,
  copytoclipboard,
  dexscreenerLink,
  dextoolLink,
  formatKMB,
  formatPrice,
} from '@/common/utils';

export function setBuyAmountsCaption() {
  return `⚙️ Set Buy Amounts\n\n<i>Enter value in format "0.03,0.04,0.05"</i>`;
}

export function setSlippageCaption() {
  return `⚙️ Set Slippage\n\n<i>Enter value in format "2.5"</i>`;
}

export function sellCustomCaption() {
  return `⚙️ Sell X %\n\n<i>Enter X Value in format "25.5"</i>`;
}

export function buyCustomCaption(nativeSymbol: string) {
  return `⚙️ Buy X ${nativeSymbol}\n\n<i>Enter ${nativeSymbol} Value in format "0.05"</i>`;
}

export function tokenInfoCaption(
  token: { name: string; symbol: string; mint: string; price: number; marketCap: number },
  wallet: string,
  walletBalance: string,
  chainKey: ChainKey,
): string {
  const caption =
    `Token: <b>${token.name ?? 'undefined'} (${token.symbol ?? 'undefined'})</b>\n` +
    `<i>${copytoclipboard(token.mint)}</i>\n\n` +
    `⛓ Chain: <b>${getChain(chainKey).label}</b>\n` +
    `💲 Price: <b>$${formatPrice(token.price)}</b>\n` +
    `📊 Market Cap: <b>$${formatKMB(token.marketCap)}</b>\n` +
    `💰 Wallet: <b>${wallet}</b>\n` +
    `💳 Wallet Balance: <b>${walletBalance}</b>\n\n` +
    `${[
      contractLink(token.mint, chainKey),
      birdeyeLink(token.mint, chainKey),
      dextoolLink(token.mint, chainKey),
      dexscreenerLink(token.mint, chainKey),
    ]
      .filter(Boolean)
      .join(' • ')}\n` +
    `🕟 ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`;

  return caption;
}
