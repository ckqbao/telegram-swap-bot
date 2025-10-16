export function isInputAmount(text: string) {
  const regex = /^[0-9]+(\.[0-9]+)?$/;
  return regex.test(text) === true;
}
