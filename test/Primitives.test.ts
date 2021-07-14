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
    expect(Primitive.Long.write(bint, true)).toEqual(buffNumberLE);
  });

  it('should be return bigint from buffer little-endian', () => {
    expect(Primitive.Long.read(buffNumberLE, 0, true)).toEqual(bint);
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
    expect(Primitive.Int128.read(buffNumberLE, 0, true)).toEqual(bint);
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
    expect(Primitive.Int256.read(buffNumberLE, 0, true)).toEqual(bint);
  });

  it('should be return buffer in big-endian', () => {
    expect(Primitive.Int256.write(bint, false)).toEqual(buffNumberBE);
  });

  it('should be return bigint from buffer big-endian', () => {
    expect(Primitive.Int256.read(buffNumberBE, 0, false)).toEqual(bint);
  });
});

describe('Testing Double data type', () => {
  const double = 1.234;
  const doubleBuf = Buffer.from('5839b4c876bef33f', 'hex');

  it('should be return buffer', () => {
    expect(Primitive.Double.write(double)).toEqual(doubleBuf);
  });

  it('should be return double', () => {
    expect(Primitive.Double.read(doubleBuf)).toEqual(double);
  });
});

describe('Testing String data type', () => {
  const str = 'hello';

  it('should be return buffer', () => {
    expect(Primitive.Str.write(str)).toBeInstanceOf(Buffer);
  });
});

describe('Testing Bool data type', () => {
  const buffTrue = Buffer.from('997275b5', 'hex').reverse();
  const buffFalse = Buffer.from('bc799737', 'hex').reverse();

  it('should be return buffer of true', () => {
    expect(Primitive.Bool.write(true)).toEqual(buffTrue);
  });

  it('should be return buffer of false', () => {
    expect(Primitive.Bool.write(false)).toEqual(buffFalse);
  });

  it('should be return true', () => {
    expect(Primitive.Bool.read(buffTrue)).toEqual(true);
  });

  it('should be return true', () => {
    expect(Primitive.Bool.read(buffFalse)).toEqual(false);
  });
});

describe('Testing Vector data type', () => {
  describe('Testing Vector<long>', () => {
    // const arrLong = [14101943622620965665n]; unsigned
    const arrLong = [-4344800451088585951n, -4344800451088585951n];
    const buffLong = Buffer.from(
      '02000000216BE86C022BB4C3216BE86C022BB4C3',
      'hex'
    );
    const buffLongWithConstruct = Buffer.from(
      '15C4B51C02000000216BE86C022BB4C3216BE86C022BB4C3',
      'hex'
    );

    describe('Read Vector<long>', () => {
      expect(Primitive.Vector.read(buffLong, Primitive.Long)).toEqual(arrLong);
    });

    describe('Write Vector<long>', () => {
      expect(Primitive.Vector.write(arrLong, Primitive.Long)).toEqual(
        buffLongWithConstruct
      );
    });
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
