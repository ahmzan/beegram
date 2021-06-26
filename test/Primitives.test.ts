import * as Primitive from '../src/TL/Core/Primitive';

// int
describe('Testing Int data type', () => {
  const buffNumberBE = Buffer.from('00BC614E', 'hex');
  const buffNumberLE = buffNumberBE.reverse();

  it('should be return buffer in little-endian', () => {
    expect(buffNumberLE).toEqual(Primitive.Int.write(12345678));
  });

  it('should be return number from buffer little-endian', () => {
    expect(12345678).toEqual(Primitive.Int.read(buffNumberLE));
  });

  it('should be return buffer in big-endian', () => {
    expect(buffNumberBE).toEqual(Primitive.Int.write(12345678, false));
  });

  it('should be return number from buffer big-endian', () => {
    expect(12345678).toEqual(Primitive.Int.read(buffNumberBE, 0, false));
  });
});

// int32
describe('Testing Int32 data type', () => {
  const buffNumberBE = Buffer.from('00BC614E', 'hex');
  const buffNumberLE = buffNumberBE.reverse();

  it('should be return buffer in little-endian', () => {
    expect(buffNumberLE).toEqual(Primitive.Int32.write(12345678));
  });

  it('should be return number from buffer little-endian', () => {
    expect(12345678).toEqual(Primitive.Int32.read(buffNumberLE));
  });

  it('should be return buffer in big-endian', () => {
    expect(buffNumberBE).toEqual(Primitive.Int32.write(12345678, false));
  });

  it('should be return number from buffer big-endian', () => {
    expect(12345678).toEqual(Primitive.Int32.read(buffNumberBE, 0, false));
  });
});

// long
describe('Testing Long data type', () => {
  const buffNumberBE = Buffer.from('002C383EFA0CFBFF', 'hex');
  const buffNumberLE = buffNumberBE.reverse();

  it('should be return buffer in little-endian', () => {
    expect(buffNumberLE).toEqual(Primitive.Long.write('12446742109551615'));
  });

  it('should be return number from buffer little-endian', () => {
    expect('12446742109551615').toEqual(Primitive.Long.read(buffNumberLE));
  });

  it('should be return buffer in big-endian', () => {
    expect(buffNumberBE).toEqual(
      Primitive.Long.write('12446742109551615', false)
    );
  });

  it('should be return number from buffer big-endian', () => {
    expect('12446742109551615').toEqual(
      Primitive.Long.read(buffNumberBE, 0, false)
    );
  });
});

describe('Testing Int64 data type', () => {
  const buffNumberBE = Buffer.from('002C383EFA0CFBFF', 'hex');
  const buffNumberLE = buffNumberBE.reverse();

  it('should be return buffer in little-endian', () => {
    expect(buffNumberLE).toEqual(Primitive.Int64.write('12446742109551615'));
  });

  it('should be return number from buffer little-endian', () => {
    expect('12446742109551615').toEqual(Primitive.Int64.read(buffNumberLE));
  });

  it('should be return buffer in big-endian', () => {
    expect(buffNumberBE).toEqual(
      Primitive.Int64.write('12446742109551615', false)
    );
  });

  it('should be return number from buffer big-endian', () => {
    expect('12446742109551615').toEqual(
      Primitive.Int64.read(buffNumberBE, 0, false)
    );
  });

  it('should be signed', () => {
    const buff = Buffer.from('FF2C383EFA0CFBFF', 'hex');
    // 18387133221781175295 alias -59610851928376321 in signed
    expect('18387133221781175295').toEqual(
      Primitive.Int64.read(buff, 0, false)
    );
  });
});

// Int128
describe('Testing Int128 data type', () => {
  const buffNumberBE = Buffer.from('00e19c14c4cbc2b04112884756e7e870', 'hex');
  const buffNumberLE = buffNumberBE.reverse();

  it('should be return buffer in little-endian', () => {
    expect(buffNumberLE).toEqual(
      Primitive.Int128.write('1171432494537149419071246194757331056')
    );
  });

  it('should be return number from buffer little-endian', () => {
    expect('1171432494537149419071246194757331056').toEqual(
      Primitive.Int128.read(buffNumberLE)
    );
  });

  it('should be return buffer in big-endian', () => {
    expect(buffNumberBE).toEqual(
      Primitive.Int128.write('1171432494537149419071246194757331056', false)
    );
  });

  it('should be return number from buffer big-endian', () => {
    expect('1171432494537149419071246194757331056').toEqual(
      Primitive.Int128.read(buffNumberBE, 0, false)
    );
  });
});

// Int128
describe('Testing Int256 data type', () => {
  const buffNumberBE = Buffer.from(
    '0098236493a5a3e34f6cd1a67eba9cce06b72d8e7f9de3ec0edac5b874689ada',
    'hex'
  );
  const buffNumberLE = buffNumberBE.reverse();

  it('should be return buffer in little-endian', () => {
    expect(buffNumberLE).toEqual(
      Primitive.Int256.write(
        '268805026512166098911412393365599542757895016790044232836700154721466882778'
      )
    );
  });

  it('should be return number from buffer little-endian', () => {
    expect(
      '268805026512166098911412393365599542757895016790044232836700154721466882778'
    ).toEqual(Primitive.Int256.read(buffNumberLE));
  });

  it('should be return buffer in big-endian', () => {
    expect(buffNumberBE).toEqual(
      Primitive.Int256.write(
        '268805026512166098911412393365599542757895016790044232836700154721466882778',
        false
      )
    );
  });

  it('should be return number from buffer big-endian', () => {
    expect(
      '268805026512166098911412393365599542757895016790044232836700154721466882778'
    ).toEqual(Primitive.Int256.read(buffNumberBE, 0, false));
  });
});

describe('Testing String data type', () => {
  const str = 'hello';
  it('should be return buffer', () => {
    Primitive.Str.write(Buffer.from(str, 'utf-8'));
  });
});
