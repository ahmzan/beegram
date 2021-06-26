import BigNumber from 'bignumber.js';
import { getBufferFromNumber, getNumberFromBuffer } from '../../Utilities';

export class Int {
  static byteCount: number = 4;
  static maxInt: number = 4294967295;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    if (little) buff = buff.reverse();

    return buff.readInt32BE();
  }

  static write(int: number, little: boolean = true) {
    const buff = Buffer.alloc(4);
    buff.writeInt32BE(int);

    if (little) return buff.reverse();

    return buff;
  }
}

export class Int32 extends Int {}
export class int extends Int {}

export class Long {
  static byteCount: number = 8;
  static maxInt: bigint = 18446744073709551615n;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    if (little) buff = buff.reverse();

    const bigNumber = new BigNumber(buff.toString('hex'), 16);

    return bigNumber.toString(10);
  }

  static write(int: string, little: boolean = true) {
    const bigNumber = new BigNumber(int, 10);

    let buff = Buffer.from(
      bigNumber.toString(16).padStart(this.byteCount * 2, '0'),
      'hex'
    );

    if (little) buff = buff.reverse();

    return buff;
  }
}

export class Int64 extends Long {}
export class long extends Long {}

export class Int128 {
  static byteCount: number = 16;
  static maxInt: bigint = 340282366920938463463374607431768211455n;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    if (little) buff = buff.reverse();

    const bigNumber = new BigNumber(buff.toString('hex'), 16);

    return bigNumber.toString(10);
  }

  static write(int: string, little: boolean = true) {
    const bigNumber = new BigNumber(int, 10);

    let buff = Buffer.from(
      bigNumber.toString(16).padStart(this.byteCount * 2, '0'),
      'hex'
    );

    if (little) buff = buff.reverse();

    return buff;
  }
}

export class Int256 {
  static byteCount: number = 32;
  static maxInt: bigint =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    if (little) buff = buff.reverse();

    const bigNumber = new BigNumber(buff.toString('hex'), 16);

    return bigNumber.toString(10);
  }

  static write(int: string, little: boolean = true) {
    const bigNumber = new BigNumber(int, 10);

    let buff = Buffer.from(
      bigNumber.toString(16).padStart(this.byteCount * 2, '0'),
      'hex'
    );

    if (little) buff = buff.reverse();

    return buff;
  }
}

export class Double {}

export class Bytes {
  static encodedLength: number;
  static read(data: Buffer) {
    if (data[0] <= 253) {
      data = data.slice(1, data[0] + 1);
      this.write(data);
      return data;
    }

    const byteLength = getNumberFromBuffer(data.slice(1, 3 + 1), true);

    data = data.slice(4, byteLength + 4);
    this.write(data);
    return data;
  }

  static write(data: Buffer) {
    let buffStr = data;

    // console.log(buffStr.length);
    // data 8

    if (buffStr.length <= 253) {
      const byteLength = getBufferFromNumber(buffStr.length, 1);
      const dataLength = buffStr.length + 1;
      // data length 9

      let paddingCount = 0;
      let padding = dataLength % 4;
      while (padding != 0) {
        paddingCount += 1;
        padding = (dataLength + paddingCount) % 4;
      }

      const result = Buffer.concat([
        byteLength,
        buffStr,
        Buffer.alloc(paddingCount)
      ]);
      this.encodedLength = result.length;
      return result;
    }

    const byteLength = getBufferFromNumber(buffStr.length, 3, true);
    const paddingCount = buffStr.length % 4;

    const result = Buffer.concat([
      Buffer.from('fe', 'hex'),
      byteLength,
      buffStr,
      Buffer.alloc(paddingCount)
    ]);
    this.encodedLength = result.length;
    return result;
  }
}

export class Str extends Bytes {}

export class Vector<T> {}
