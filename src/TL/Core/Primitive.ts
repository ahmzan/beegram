import { getBufferFromNumber, getNumberFromBuffer, Integer } from '../../Utilities';

export class Int {
  static byteCount: number = 4;
  static maxInt: number = 2147483647;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    if (little) buff = buff.reverse();

    return buff.readInt32BE();
  }

  static write(int: number | bigint, little: boolean = true) {
    if(typeof int =='bigint') int = parseInt(int.toString())

    const buff = Buffer.alloc(4);
    if (int > this.maxInt) buff.writeUInt32BE(int);
    else buff.writeInt32BE(int);

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

    // if (little) buff = buff.reverse();

    // return BigInt(bigInt(buff.toString('hex'), 16).toString());
    return Integer.fromBuff(buff, 8, little ? 'little' : 'big', true)
  }

  static write(int: bigint, little: boolean = true) {
    if (int > this.maxInt) throw Error('integer is too big');

    // const binthex = int.toString(16).padStart(this.byteCount * 2, '0');
    // const buff = Buffer.from(binthex, 'hex');

    // if (little) return buff.reverse();

    // return buff;
    return Integer.toBuff(int, 8, little ? 'little':'big', true)
  }
}

export class Int64 extends Long {}
export class long extends Long {}

export class Int128 {
  static byteCount: number = 16;
  static maxInt: bigint = 340282366920938463463374607431768211455n;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    // if (little) buff = buff.reverse();

    // return BigInt(bigInt(buff.toString('hex'), 16).toString());
    return Integer.fromBuff(buff, 16, little ? 'little' : 'big', true)

  }

  static write(int: bigint, little: boolean = true) {
    if (int > this.maxInt) throw Error('integer is too big');

    // const binthex = int.toString(16).padStart(this.byteCount * 2, '0');
    // const buff = Buffer.from(binthex, 'hex');

    // if (little) return buff.reverse();

    // return buff;
    return Integer.toBuff(int, 16, little ? 'little' : 'big' , true)
  }
}

export class Int256 {
  static byteCount: number = 32;
  static maxInt: bigint =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    // if (little) buff = buff.reverse();

    // return BigInt(bigInt(buff.toString('hex'), 16).toString());
    return Integer.fromBuff(buff, 32, little ? 'little' : 'big', true)
  }

  static write(int: bigint, little: boolean = true) {
    if (int > this.maxInt) throw Error('integer is too big');

    // const binthex = int.toString(16).padStart(this.byteCount * 2, '0');
    // const buff = Buffer.from(binthex, 'hex');

    // if (little) return buff.reverse();

    // return buff;
    return Integer.toBuff(int, 32, little ? 'little' : 'big', true)
  }
}

export class Double {
  static byteCount: number = 8;
  static max: number = 5.486124068793688e+303;

  static read(buff: Buffer, offset: number = 0, little: boolean = true) {
    buff = buff.slice(offset, offset + this.byteCount);

    if (little) buff = buff.reverse();

    return buff.readDoubleBE();
  }

  static write(double: number, little: boolean = true) {
    if (double > this.max) throw Error('number is too big');

    const buff = Buffer.alloc(this.byteCount);
    buff.writeDoubleBE(double);

    if (little) return buff.reverse();

    return buff;
  }
}


export class Bytes {
  static encodedLength: number;
  static read(data: Buffer, offset: number = 0) {
    data = data.slice(offset);
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

export class Str {
  static encodedLength:number
  static read(data: Buffer, offset: number = 0){
    const str = Bytes.read(data, offset).toString('utf-8')
    this.write(str)
    return str
  }

  static write(str:string){
    const buffStr = Buffer.from(str, 'utf-8')

    const result =  Bytes.write(buffStr)
    this.encodedLength = result.length
    return result
  }
}

export class Vector {
  private static id: number = 0x1cb5c415
  private static offset: number = 0

  private static dataLength: any
  private static data: any[] = []
  private static primitive: string[] = ['Int', 'Long', 'Int128', 'Int256', 'Double', 'Str', 'Bytes', 'Bool']

  static encodedLength: number
  static read(data: Buffer, type: any) {
    this.dataLength = this._read(Int, data, true);
    for (var i = 0; i < this.dataLength; i++) {
      this.data.push(this._read(type, data, true));
    }
    return this.data;
  }
  
  static write(dataList: any[], type: any) {
    this.dataLength = dataList.length

    this.data = dataList.map((item) => {
      if(item instanceof Buffer) return item
      if(this.primitive.includes(type.name)) return type.write(item)
      return new type(item).write()
    })

    const result = Buffer.concat([Int.write(this.id, true), Int.write(this.dataLength, true), ...this.data])
    this.encodedLength = result.length
    return result
  }

  private static _read(dataType: any, value: any, little: boolean = false) {
    const result = dataType.read(value, this.offset, little);
    this.offset += dataType.byteCount || dataType.encodedLength;
    return result;
  }
}

export class Bool {
  static byteCount: number = 4
  static idTrue: number = 0x997275b5
  static idFalse: number = 0xbc799737
  static read(data: Buffer, offset: number = 0){
    data = data.slice(offset, offset + this.byteCount)

    const constructId = Int.read(data, 0, true)
    
    // convert to usigned number
    return constructId >>> 0 == this.idTrue ? true : false
  }

  static write(bool:boolean){

    return Int.write(bool? this.idTrue : this.idFalse, true)
  }
}
