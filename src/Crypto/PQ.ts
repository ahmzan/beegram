import BigNumber from 'bignumber.js';

function Brent(n: bigint | BigNumber) {
  if (typeof n == 'bigint') n = new BigNumber(n.toString());

  if (n.mod(2).eq(0)) return BigInt(2);

  let y = new BigNumber(Math.random() * n.toNumber() + 1);
  let c = new BigNumber(Math.random() * n.toNumber() + 1);
  let m = new BigNumber(Math.random() * n.toNumber() + 1);
  // console.log(y, c, m);

  let g = new BigNumber(1);
  let r = new BigNumber(1);
  let q = new BigNumber(1);
  // console.log(g, r, q);

  let x = new BigNumber(0);
  let ys = new BigNumber(0);
  // console.log(x, ys);

  while (g.eq(1)) {
    // console.log(g.eq(1));

    x = y;
    // console.log(x);

    for (var i = 1; i <= r.toNumber(); i++) {
      // console.log(i);

      y = y.multipliedBy(y).mod(n).plus(c).mod(n);
      // console.log(y);
    }

    let k = new BigNumber(0);
    // console.log(k);

    while (k.isLessThan(r) && g.eq(1)) {
      ys = y;
      // console.log(ys);

      // console.log(m.toNumber(), r, k);
      for (
        var j = 1;
        j <= Math.min(m.toNumber(), r.toNumber() - k.toNumber());
        j++
      ) {
        y = y.multipliedBy(y).mod(n).plus(c).mod(n);
        q = q.multipliedBy(x.minus(y).abs()).mod(n);
      }

      g = gcd(q, n);
      k = k.plus(m);
    }

    r = r.multipliedBy(2);
  }

  if (q.eq(n)) {
    while (true) {
      ys = ys.multipliedBy(ys).mod(n).plus(c).mod(n);
      g = gcd(x.minus(ys).abs(), n);
      if (g.isGreaterThan(1)) {
        break;
      }
    }
  }

  return BigInt(g.toString());
}

function gcd(a: BigNumber, b: BigNumber) {
  let r = new BigNumber(0);

  while (!b.eq(0)) {
    r = a.mod(b);
    a = b;
    b = r;
  }

  return a;
}

export { Brent };

// console.log(Brent(new BigNumber('2523569261574185919207964672')));
