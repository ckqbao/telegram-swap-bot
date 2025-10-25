declare module 'bs58' {
  /**
   * Encode a buffer to a base58 string
   */
  function encode(buffer: Buffer | Uint8Array | number[]): string;

  /**
   * Decode a base58 string to a buffer
   */
  function decode(string: string): Buffer;

  export { encode, decode };
  export default { encode, decode };
}
