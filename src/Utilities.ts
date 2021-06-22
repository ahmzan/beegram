import bigInt from 'big-integer';

export function getBufferFromNumber(
  bigNumber: bigInt.BigInteger | number,
  byteNumber: number,
  little?: boolean
) {
  if (typeof bigNumber == 'number') bigNumber = bigInt(bigNumber);

  const bitLength = bigNumber.bitLength().toJSNumber();
  const bytes = Math.ceil(bitLength / 8);

  if (bytes > byteNumber) throw new Error('number is too big');

  let hex = bigNumber.toString(16).padStart(byteNumber * 2, '0');

  if (little) hex = hex.match(/.{2}/g).reverse().join('');

  return Buffer.from(hex, 'hex');
}

export function getNumberFromBuffer(buffer: Buffer, isLitle?: boolean) {
  const byteLength = buffer.length;

  if (isLitle) buffer.reverse();

  const hex = buffer.toString('hex').slice(byteLength);

  return bigInt(hex, 16).toJSNumber();
}
