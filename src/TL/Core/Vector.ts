import { Int, Int128, Long, Str } from '../Core';

export class Vector {
  // private id: number;
  // private count: number;
  // private data: T[];

  private static offset: number = 0;
  static count: any;
  static data: any[] = [];

  // constructor(data: T[]) {
  //   this.id = 0x1cb5c415;

  //   this.count = data.length;
  //   this.data = data;
  // }

  // write() {
  //   return Buffer.concat([
  //     Int.write(this.id, true),
  //     Int128.write(this.nonce, false)
  //   ]);
  // }

  static read(data: Buffer, type: any) {
    this.count = this._read(Int, data, true);
    for (var i = 0; i < this.count; i++) {
      this.data.push(this._read(type, data, true));
    }

    return this.data;
  }

  private static _read(dataType: any, value: any, little: boolean = false) {
    const result = dataType.read(value, this.offset, little);
    this.offset += dataType.byteCount || dataType.encodedLength;
    return result;
  }
}

// console.log(new Vector<Int>([Int.write(123)]).write());
// const raw = '01000000216BE86C022BB4C3';
// console.log(Vector.read(Buffer.from(raw, 'hex'), Long));
