import * as Primitive from '../src/TL/Core/Primitive';

// int
describe('Testing Int data type', () => {
  const buffNumberBE = Buffer.from('00BC614E', 'hex');
  const buffNumberLE = buffNumberBE.reverse();
  const num = 12345678;

  it('should be return buffer in little-endian', () => {
    expect(Primitive.Int.write(num)).toEqual(buffNumberLE);
  });

  it('should be return number from buffer little-endian', () => {
    expect(Primitive.Int.read(buffNumberLE)).toEqual(num);
  });

  it('should be return buffer in big-endian', () => {
    expect(Primitive.Int.write(12345678, false)).toEqual(buffNumberBE);
  });

  it('should be return number from buffer big-endian', () => {
    expect(Primitive.Int.read(buffNumberBE, 0, false)).toEqual(num);
  });
});

// long
describe('Testing Long data type', () => {
  const buffNumberBE = Buffer.from('002C383EFA0CFBFF', 'hex');
  const buffNumberLE = buffNumberBE.reverse();
  const bint = 12446742109551615n;

  it('should be return buffer in little-endian', () => {
    expect(Primitive.Long.write(bint)).toEqual(buffNumberLE);
  });

  it('should be return bigint from buffer little-endian', () => {
    expect(Primitive.Long.read(buffNumberLE)).toEqual(bint);
  });

  it('should be return buffer in big-endian', () => {
    expect(Primitive.Long.write(bint, false)).toEqual(buffNumberBE);
  });

  it('should be return bigint from buffer big-endian', () => {
    expect(Primitive.Long.read(buffNumberBE, 0, false)).toEqual(bint);
  });
});

// Int128
describe('Testing Int128 data type', () => {
  const buffNumberBE = Buffer.from('00E19C14C4CBC2B04112884756E7E870', 'hex');
  const buffNumberLE = buffNumberBE.reverse();
  const bint = 1171432494537149419071246194757331056n;

  it('should be return buffer in little-endian', () => {
    expect(Primitive.Int128.write(bint)).toEqual(buffNumberLE);
  });

  it('should be return number from buffer little-endian', () => {
    expect(Primitive.Int128.read(buffNumberLE)).toEqual(bint);
  });

  it('should be return buffer in big-endian', () => {
    expect(Primitive.Int128.write(bint, false)).toEqual(buffNumberBE);
  });

  it('should be return number from buffer big-endian', () => {
    expect(Primitive.Int128.read(buffNumberBE, 0, false)).toEqual(bint);
  });
});

// Int256
describe('Testing Int256 data type', () => {
  const buffNumberBE = Buffer.from(
    '0098236493a5a3e34f6cd1a67eba9cce06b72d8e7f9de3ec0edac5b874689ada',
    'hex'
  );
  const buffNumberLE = buffNumberBE.reverse();
  const bint =
    268805026512166098911412393365599542757895016790044232836700154721466882778n;

  it('should be return buffer in little-endian', () => {
    expect(Primitive.Int256.write(bint)).toEqual(buffNumberLE);
  });

  it('should be return number from buffer little-endian', () => {
    expect(Primitive.Int256.read(buffNumberLE)).toEqual(bint);
  });

  it('should be return buffer in big-endian', () => {
    expect(Primitive.Int256.write(bint, false)).toEqual(buffNumberBE);
  });

  it('should be return bigint from buffer big-endian', () => {
    expect(Primitive.Int256.read(buffNumberBE, 0, false)).toEqual(bint);
  });
});

describe('Testing String data type', () => {
  const str = 'hello';
  it('should be return buffer', () => {
    Primitive.Str.write(Buffer.from(str, 'utf-8'));
  });
});

describe('Testing exact msgId operation', () => {
  const id = BigInt(Math.round(Date.now() / 1000)) * 2n ** 32n;
  // console.log(id);

  it('should be return buffer', () => {
    // console.log(Primitive.Long.write(id));
    expect(Primitive.Long.write(id)).toBeInstanceOf(Buffer);
  });
});
