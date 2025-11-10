import dayjs from 'dayjs';
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

export function buyCustomCaption() {
  return `⚙️ Buy X BNB\n\n<i>Enter BNB Value in format "0.05"</i>`;
}

export function tokenInfoCaption(
  token: { name: string; symbol: string; mint: string; price: number; marketCap: number },
  wallet: string,
  walletBalance: string,
): string {
  const caption =
    `Token: <b>${token.name ?? 'undefined'} (${token.symbol ?? 'undefined'})</b>\n` +
    `<i>${copytoclipboard(token.mint)}</i>\n\n` +
    `💲 Price: <b>$${formatPrice(token.price)}</b>\n` +
    `📊 Market Cap: <b>$${formatKMB(token.marketCap)}</b>\n` +
    `💰 Wallet: <b>${wallet}</b>\n` +
    `💳 Wallet Balance: <b>${walletBalance}</b>\n\n` +
    `${contractLink(token.mint)} • ${birdeyeLink(token.mint)} • ${dextoolLink(token.mint)} • ${dexscreenerLink(token.mint)}\n` +
    `🕟 ${dayjs().format('DD/MM/YYYY HH:mm:ss')}`;

  return caption;
}
