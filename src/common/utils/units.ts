/**
 * Converts a decimal amount to base units by shifting the decimal point.
 * This is commonly used to convert human-readable token amounts to their smallest unit
 * representation (e.g., ETH to wei, or any ERC-20 token amount to its base units).
 *
 * @param amount - The token amount as a decimal string (e.g., "1.5", "0.001")
 * @param decimals - The number of decimal places for the token (e.g., 18 for most ERC-20 tokens)
 * @returns The amount in base units as a string (e.g., "1500000000000000000" for 1.5 ETH with 18 decimals)
 *
 * @example
 * toBaseUnits("1.5", 18) // Returns "1500000000000000000"
 * toBaseUnits("100", 6) // Returns "100000000"
 * toBaseUnits("0.001", 18) // Returns "1000000000000000"
 */
export function toBaseUnits(amount: string, decimals: number): string {
  // Remove any decimal point and count the decimal places
  const [integerPart, decimalPart = ''] = amount.split('.');
  const currentDecimals = decimalPart.length;

  // Combine integer and decimal parts, removing the decimal point
  let result = integerPart + decimalPart;

  // Add zeros if you need more decimal places
  if (currentDecimals < decimals) {
    result = result + '0'.repeat(decimals - currentDecimals);
  }
  // Remove digits if you have too many decimal places
  else if (currentDecimals > decimals) {
    result = result.slice(0, result.length - (currentDecimals - decimals));
  }

  // Remove leading zeros
  result = result.replace(/^0+/, '') || '0';

  return result;
}
