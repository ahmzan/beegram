/* 
beegram - Telegram MTProto API Client Framework
Copyright (C) 2021 Ahmzan <https://github.com/ahmzan>

This file is part of beegram.

beegram is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

beegram is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with beegram.  If not, see <https://www.gnu.org/licenses/>.
*/

import bigInt from 'big-integer';
import crypto from 'crypto';

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

  const buff = Buffer.from(hex, 'hex');
  if (little) buff.reverse();

  return buff;
}

export function getNumberFromBuffer(buffer: Buffer, isLitle?: boolean) {
  const byteLength = buffer.length;

  if (isLitle) buffer.reverse();

  const hex = buffer.toString('hex').slice(byteLength);

  return bigInt(hex, 16).toJSNumber();
}

export class Integer {
  static int: bigint;
  static fromBuff(
    buff: Buffer,
    length: number,
    order: 'big' | 'little' = 'big',
    signed: boolean = false
  ) {
    if (order == 'little') buff = buff.reverse();
    buff = buff.slice(0, length);
    let bint = bigInt(buff.toString('hex'), 16);

    if (signed) {
      const maxUint = bigInt(Buffer.alloc(length, 255).toString('hex'), 16).plus(1);
      const maxInt = bigInt(Buffer.alloc(length, 127).fill(0, 1).toString('hex'), 16);
      // console.log(maxUint);
      // console.log(maxInt);
      if (bint.greater(maxInt)) bint = bint.minus(maxUint);
    }

    return BigInt(bint.toString());
  }

  static toBuff(
    int: bigint | number,
    length: number,
    order: 'big' | 'little' = 'big',
    signed: boolean = false
  ) {
    if (!signed && int < 0n) throw new Error('cannot convert negative integer');
    let bint = bigInt(int.toString());

    if (signed) {
      const maxUint = bigInt(Buffer.alloc(length, 255).toString('hex'), 16).plus(1);
      if (bint.isNegative()) bint = bint.plus(maxUint);
    }

    const binthex = bint.toString(16).padStart(length * 2, '0');
    let buff = Buffer.from(binthex, 'hex');

    if (order == 'little') buff = buff.reverse();

    return buff;
  }

  static random(length: number, signed: boolean = false) {
    const rand = crypto.randomBytes(length);
    return this.fromBuff(rand, length, 'big', signed);
  }

  static randomByte(length: number) {
    const rand = crypto.randomBytes(length);
    return rand;
  }
}

export function sha1(data: Buffer) {
  return crypto.createHash('sha1').update(data).digest();
}

export function sha256(data: Buffer) {
  return crypto.createHash('sha256').update(data).digest();
}

export function md5(data: Buffer) {
  return crypto.createHash('md5').update(data).digest();
}

// https://www.typescriptlang.org/docs/handbook/mixins.html#alternative-pattern
export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
      );
    });
  });
}

export function xorBytes(input1: Buffer, input2: Buffer) {
  const length = Math.max(input1.length, input2.length);
  const result = Buffer.alloc(length);

  for (var i = 0; i < length; i++) {
    result[i] = input1[i] ^ input2[i];
  }
  return result;
}
