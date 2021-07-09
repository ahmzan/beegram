import { Integer } from '../src/Utilities';

describe('Random int byte', () => {
  it('should be return buffer with length 3', () => {
    expect(Integer.randomByte(3)).toHaveLength(3);
  });

  it('should be return buffer with length 16', () => {
    expect(Integer.randomByte(16)).toHaveLength(16);
  });

  it('should be return buffer with length 32', () => {
    expect(Integer.randomByte(32)).toHaveLength(32);
  });
});

describe('Convert positive bigint to buffer', () => {
  const bint = 11893802339158027918n;
  const bintBuffBE = Buffer.from('a50f46361e396e8e', 'hex');
  const bintBuffLE = Buffer.from('a50f46361e396e8e', 'hex').reverse();

  console.log(bintBuffBE);
  console.log(bintBuffLE);

  it('should be return a buffer BE from bigint', () => {
    expect(Integer.toBuff(bint, 8, 'big', false)).toEqual(bintBuffBE);
  });

  it('should be return a buffer LE from int in', () => {
    expect(Integer.toBuff(bint, 8, 'little', false)).toEqual(bintBuffLE);
  });
});

describe('Convert negative bigint to buffer', () => {
  const bint = -57790151973349716255802441803964196369n;
  const bintBuffBE = Buffer.from('d48605866c500548be12ad05e0ae59ef', 'hex');
  const bintBuffLE = Buffer.from(
    'd48605866c500548be12ad05e0ae59ef',
    'hex'
  ).reverse();

  it('should be return a buffer BE from bigint', () => {
    expect(Integer.toBuff(bint, 16, 'big', true)).toEqual(bintBuffBE);
  });

  it('should be return a buffer LE from int in', () => {
    expect(Integer.toBuff(bint, 16, 'little', true)).toEqual(bintBuffLE);
  });
});

// describe('Convert negative bigint with unsigned param', () => {
//   const bint = -6552941734551523698n;
//   const bintBuff = Buffer.from('a50f46361e396e8e', 'hex');

//   it('should be return a error', () => {
//     expect(Integer.toBuff(bint, 8, 'big', false)).toThrowError(
//       new Error('cannot convert negative integer')
//     );
//   });
// });
