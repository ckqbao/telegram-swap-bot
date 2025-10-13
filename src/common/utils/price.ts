export function formatKMB(val: bigint | string | number) {
  if (!val) return '0';
  if (Number(val) > 1000000000) {
    return `${(Number(val) / 1000000000).toFixed(1)}B`;
  }
  if (Number(val) > 1000000) {
    return `${(Number(val) / 1000000).toFixed(1)}M`;
  }
  if (Number(val) > 1000) {
    return `${(Number(val) / 1000).toFixed(1)}k`;
  }
  return Number(val).toFixed(3);
}

export function formatPrice(price: number) {
  if (!price || price <= 0) return 0;
  // If the price is less than 1, format it to 6 decimal places
  if (price < 1) {
    let decimal = 15;
    while (true) {
      if (price * 10 ** decimal < 1) {
        break;
      }
      decimal--;
    }
    return price.toFixed(decimal + 3);
  }
  // If the price is greater than or equal to 1, format it to 3 decimal places
  return price.toFixed(2);
}
