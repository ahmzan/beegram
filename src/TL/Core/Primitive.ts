import BigNumber from 'bignumber.js';

export class UInt {
  static byteCount: number = 4;
  static maxUInt: number = 4294967295;

  static read(buff: Buffer, little?: boolean) {
    if (buff.length > this.byteCount) throw new Error('Buffer is not Int');

    if (little) buff = buff.reverse();
    const hex = buff.toString('hex');

    return Buffer.from(hex, 'hex').readUInt32BE();
  }

  static write(int: number, little?: boolean) {
    if (int > this.maxUInt) throw new Error('Number is too big');
    if (int < 0) throw new Error('Cannot convert negative number');

    const hex = int.toString(16).padStart(this.byteCount * 2, '0');
    const buff = Buffer.from(hex, 'hex');

    if (little) return buff.reverse();

    return buff;
  }
}

export class ULong {
  static byteCount: number = 8;
  static maxUInt: bigint = 18446744073709551615n;

  static read(buff: Buffer, little?: boolean) {
    if (buff.length > this.byteCount) throw new Error('Buffer is not Long');

    if (little) buff = buff.reverse();
    const hex = buff.toString('hex');

    return Buffer.from(hex, 'hex').readBigUInt64BE();
  }

  static write(int: bigint, little?: boolean) {
    if (int > this.maxUInt) throw new Error('Number is too big');
    if (int < 0) throw new Error('Cannot convert negative number');

    const hex = int.toString(16).padStart(this.byteCount * 2, '0');
    const buff = Buffer.from(hex, 'hex');

    if (little) return buff.reverse();

    return buff;
  }
}

export class UInt128 {
  static byteCount: number = 16;
  static maxNumber: bigint = 340282366920938463463374607431768211455n;

  static read(buff: Buffer, little?: boolean) {
    if (buff.length > this.byteCount) throw new Error('Buffer is not Int128');

    if (little) buff = buff.reverse();
    const bigNumber = new BigNumber(buff.toString('hex'), 16);

    return BigInt(bigNumber.toString(10));
  }

  static write(int: bigint, little?: boolean) {
    if (int > this.maxNumber) throw new Error('Number is too big');
    if (int < 0) throw new Error('Cannot convert negative number');

    const bigNumber = new BigNumber(int.toString(), 10);
    const buff = Buffer.from(
      bigNumber.toString(16).padStart(this.byteCount * 2, '0'),
      'hex'
    );

    if (little) return buff.reverse();

    return buff;
  }
}

export class UInt256 {
  static byteCount: number = 32;
  static maxNumber: bigint =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n;

  static read(buff: Buffer, little?: boolean) {
    if (buff.length > this.byteCount) throw new Error('Buffer is not Int256');

    if (little) buff = buff.reverse();
    const bigNumber = new BigNumber(buff.toString('hex'), 16);

    return BigInt(bigNumber.toString(10));
  }

  static write(int: bigint, little?: boolean) {
    if (int > this.maxNumber) throw new Error('Number is too big');
    if (int < 0) throw new Error('Cannot convert negative number');

    const bigNumber = new BigNumber(int.toString(), 10);
    const buff = Buffer.from(
      bigNumber.toString(16).padStart(this.byteCount * 2, '0'),
      'hex'
    );

    if (little) return buff.reverse();

    return buff;
  }
}
