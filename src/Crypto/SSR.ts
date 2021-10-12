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

import { passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow } from '../TL/Schema';
import { Integer, sha256, xorBytes } from '../Utilities';
import { pbkdf2Sync } from 'crypto';
import bigInt from 'big-integer';

// https://core.telegram.org/api/srp
// https://core.telegram.org/api/srp#checking-the-password-with-srp
export function getSSR(
  inputPassword: string,
  algo: passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow,
  srp_B?: Buffer
) {
  if (srp_B == undefined) throw Error('srp_b empty');
  const password = Buffer.from(inputPassword, 'utf-8');
  const { g, p, salt1, salt2 } = algo;
  const g_b = srp_B;

  const k = H(Buffer.concat([p, Integer.toBuff(g, 256, 'big', true)]));

  const a = Integer.random(256);

  const g_a = bigInt(g).modPow(bigInt(a), bigInt(p.toString('hex'), 16));

  const u = H(Buffer.concat([Buffer.from(g_a.toString(16), 'hex'), g_b]));

  const x = PH2(password, salt1, salt2);
  const v = bigInt(g).modPow(bigInt(x.toString('hex'), 16), bigInt(p.toString('hex'), 16));

  const k_v = bigInt(k.toString('hex'), 16)
    .multiply(v)
    .mod(bigInt(p.toString('hex'), 16));

  let t = bigInt(g_b.toString('hex'), 16)
    .subtract(k_v)
    .mod(bigInt(p.toString('hex'), 16));
  if (t.isNegative()) t = t.add(bigInt(p.toString('hex'), 16));
  const s_a = t.modPow(
    bigInt(a).add(bigInt(u.toString('hex'), 16).multiply(bigInt(x.toString('hex'), 16))),
    bigInt(p.toString('hex'), 16)
  );
  const k_a = H(Buffer.from(s_a.toString(16), 'hex'));

  const M1 = H(
    Buffer.concat([
      xorBytes(H(p), H(Integer.toBuff(g, 256, 'big', true))),
      H(salt1),
      H(salt2),
      Buffer.from(g_a.toString(16), 'hex'),
      g_b,
      k_a
    ])
  );

  return { A: Buffer.from(g_a.toString(16), 'hex'), M1: M1 };
}

const H = (data: Buffer) => sha256(data);
const SH = (data: Buffer, salt: Buffer) => H(Buffer.concat([salt, data, salt]));
const PH1 = (password: Buffer, salt1: Buffer, salt2: Buffer) => SH(SH(password, salt1), salt2);
const PH2 = (password: Buffer, salt1: Buffer, salt2: Buffer) =>
  SH(pbkdf2Sync(PH1(password, salt1, salt2), salt1, 100000, 64, 'sha512'), salt2);
