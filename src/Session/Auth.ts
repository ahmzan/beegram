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

import { Connection } from '../Connection';
import { Int, Long } from '../TL/Core/Primitive';
import { TLObject } from '../TL/Core/TLObject';
import { Brent } from '../Crypto/PQ';
import { Integer, sha1 } from '../Utilities';
import { promisify } from 'util';
import bigInt from 'big-integer';
import debug from 'debug';
import * as TL from '../TL';
import * as rsa from '../Crypto/RSA';
import * as aes from '../Crypto/AES';

const log = debug('Auth');
const sleep = promisify(setTimeout);

export class Auth {
  dcId: number;
  testMode: boolean;
  connection!: Connection;
  retries: number = 5;
  lastMsgId: bigint = 0n;

  constructor(dcId: number, testMode: boolean) {
    log('Initial Auth');
    this.dcId = dcId;
    this.testMode = testMode;
  }

  getMsgId(): bigint {
    log('Geting msg_id');
    const time = Date.now();
    const timeSec = Math.floor(time / 1000);
    const timeMSec = time % 1000;
    const random = Math.floor(Math.random() * 0xffff);

    let msgId = bigInt(timeSec)
      .shiftLeft(32)
      .add(
        bigInt(timeMSec)
          .shiftLeft(21)
          .or(random << 3)
          .or(4)
      );

    if (msgId.lt(this.lastMsgId)) {
      msgId = msgId.plus(4);
    }
    this.lastMsgId = BigInt(msgId.toString());
    log('Msg_id %o', this.lastMsgId);
    return this.lastMsgId;
  }

  async pack(data: Buffer) {
    // const msgId = BigInt(Math.round(Date.now() / 1000)) * 2n ** 32n;
    // const msgId = this.getMsgId();

    return Buffer.concat([
      Buffer.alloc(8),
      Long.write(this.getMsgId(), true),
      Int.write(data.length, true),
      data
    ]);
  }

  async unpack(data: Buffer): Promise<any> {
    log('Slice header unpack %o', data.slice(20).toString('hex'));
    return await TLObject.read(data.slice(20));
  }

  async send(data: any): Promise<any> {
    const packed = await this.pack(await data.write());
    await this.connection.send(packed);

    const response = await this.connection.receive();
    return await this.unpack(response);
  }

  async create(): Promise<Buffer> {
    while (true) {
      // https://core.telegram.org/mtproto/auth_key
      try {
        this.connection = new Connection(this.dcId, this.testMode);

        log('Create new auth key on dc %o test mode %o', this.dcId, this.testMode);
        await this.connection.connect();

        // 1, 2 request pq authorization
        // https://core.telegram.org/mtproto/samples-auth_key#1-request-for-pq-authorization
        // https://core.telegram.org/mtproto/samples-auth_key#2-a-response-from-the-server-has-been-received-with-the-following-content
        const nonce = Integer.random(16, true);
        const nonceBuf = Integer.toBuff(nonce, 16, 'big', true);
        log('nonce %o %o %o', nonce, nonceBuf.toString('hex'), nonceBuf.length);

        log('Send request req_pq_multi %o', nonce);
        const resPQ: TL.Proto.resPQ = await this.send(new TL.Proto.req_pq_multi({ nonce: nonce }));
        log('ResPQ %o', resPQ);

        log('Nonce is equal? %o', resPQ.nonce == nonce);

        let fingerprint;
        for (var key of resPQ.server_public_key_fingerprints) {
          if (rsa.publicServerKeys.has(key.toString())) {
            fingerprint = key;
            log('Using fingerprint %o', fingerprint);
          } else {
            log('Unknown fingerprint %o', key);
          }
        }
        if (!fingerprint) throw new Error('Fingerprint notfound');

        // 3 decompose pq into prime factor
        // https://core.telegram.org/mtproto/samples-auth_key#3-pq--17ed48941a08f981-decomposed-into-2-prime-cofactors
        const pq = Integer.fromBuff(resPQ.pq, 8, 'big');
        log('Factoring PQ %o', pq);
        const g = Brent(pq);
        const [p, q] = [g, pq / g].sort();
        log('Factoring done P:%o Q: %o', p, q);

        // 4.1 encrypted data generation
        // https://core.telegram.org/mtproto/samples-auth_key#4-encrypted-data-generation
        const new_nonce = Integer.random(32, true);
        let new_nonceBuf = Integer.toBuff(new_nonce, 32, 'little', true);
        log(
          'Generate new_nonce %o %o %o',
          new_nonce,
          new_nonceBuf.toString('hex'),
          new_nonceBuf.length
        );
        const server_nonce = resPQ.server_nonce;
        let server_nonceBuf = Integer.toBuff(server_nonce, 16, 'little', true);
        log(
          'Server_nonce %o %o %o',
          server_nonce,
          server_nonceBuf.toString('hex'),
          server_nonceBuf.length
        );

        const pBytes = Integer.toBuff(p, 4, 'big');
        const qBytes = Integer.toBuff(q, 4, 'big');

        let dataConstruct = new TL.Proto.p_q_inner_data({
          pq: resPQ.pq,
          p: pBytes,
          q: qBytes,
          nonce: nonce,
          server_nonce: server_nonce,
          new_nonce: new_nonce
        });
        const data = await dataConstruct.write();
        log('PQInnerdata %o %o %o', dataConstruct, data.toString('hex'), data.length);

        const dataSha = sha1(data);
        log('PQInnerdata SHA1 %o %o', dataSha.toString('hex'), dataSha.length);

        let paddingCount = 255 - (20 + data.length); // sha1 20
        log('Padding count %o', paddingCount);

        const data_with_padding = Buffer.concat([data, Integer.randomByte(paddingCount)]);
        log('Data_with_padding %o %o', data_with_padding.toString('hex'), data_with_padding.length);

        const data_with_hash = Buffer.concat([dataSha, data_with_padding]);
        log('Data_with_hash %o %o', data_with_hash.toString('hex'), data_with_hash.length);

        log('Encrypting data with rsa');
        const encrypted_data = rsa.encrypt(data_with_hash, fingerprint); // final length should be 256
        log('Encrypting done');
        log('Encrypted_data %o %o', encrypted_data.toString('hex'), encrypted_data.length);

        //  4 request dh key
        // https://core.telegram.org/mtproto/samples-auth_key#request-to-start-diffie-hellman-key-exchange
        const dhParams = new TL.Proto.req_DH_params({
          nonce: nonce,
          server_nonce: server_nonce,
          p: pBytes,
          q: qBytes,
          public_key_fingerprint: fingerprint,
          encrypted_data: encrypted_data
        });
        const dhParamsBuf = await dhParams.write();
        log('ReqDHParams %o %o %o', dhParams, dhParamsBuf.toString('hex'), dhParamsBuf.length);

        // 5 responds
        const serverDHParams: TL.Proto.server_DH_params_ok = await this.send(dhParams);
        log('ServerDHParams %o', serverDHParams);

        log('Server_nonce is equal? %o', server_nonce == serverDHParams.server_nonce);

        const encrypted_answer = serverDHParams.encrypted_answer;
        log('Encrypted_answer %o %o', encrypted_answer.toString('hex'), encrypted_answer.length);

        log(
          'Buff new_nonce same with int? %o',
          Integer.fromBuff(new_nonceBuf, 32, 'little', true) == new_nonce
        );
        log(
          'Buff server_nonce same with int? %o',
          Integer.fromBuff(server_nonceBuf, 16, 'little', true) == server_nonce
        );

        new_nonceBuf = new_nonceBuf.reverse();
        server_nonceBuf = server_nonceBuf.reverse();

        const shaNS = sha1(Buffer.concat([new_nonceBuf, server_nonceBuf]));
        const shaSN = sha1(Buffer.concat([server_nonceBuf, new_nonceBuf]));
        const shaNN = sha1(Buffer.concat([new_nonceBuf, new_nonceBuf]));

        const temp_aes_key = Buffer.concat([shaNS, shaSN.slice(0, 12)]);
        const temp_aes_iv = Buffer.concat([shaSN.slice(12, 20), shaNN, new_nonceBuf.slice(0, 4)]);

        const answer_with_hash = aes.ige256Decrypt(encrypted_answer, temp_aes_key, temp_aes_iv);

        log('Answer_with_hash %o %o', answer_with_hash.toString('hex'), answer_with_hash.length);

        const answer = answer_with_hash.slice(20);
        log('Answer %o %o', answer.toString('hex'), answer.length);

        const serverDHInnerData: TL.Proto.server_DH_inner_data = await TLObject.read(answer);
        log('ServerDHInnerData %o', serverDHInnerData);

        log(
          'DHPrime %o %o',
          serverDHInnerData.dh_prime.toString('hex'),
          serverDHInnerData.dh_prime.length
        );
        const dh_prime = Integer.fromBuff(serverDHInnerData.dh_prime, 256, 'big');
        log('Delta server time %o', Math.floor(Date.now() / 1000) - serverDHInnerData.server_time);

        // 6
        // https://core.telegram.org/mtproto/samples-auth_key#6-random-number-b-is-computed
        const b = Integer.random(256);
        const sg = serverDHInnerData.g;

        const g_b = Integer.toBuff(BigInt(bigInt(sg).modPow(b, dh_prime).toString()), 256, 'big');

        const retryId = 0n;

        const cdi_data = await new TL.Proto.client_DH_inner_data({
          nonce: nonce,
          server_nonce: server_nonce,
          retry_id: retryId,
          g_b: g_b
        }).write();

        const cdiSha = sha1(cdi_data);
        const padding = 16 - ((cdi_data.length + 20) % 16); // 20 sha length

        const cdi_data_with_hash = Buffer.concat([cdiSha, cdi_data, Integer.randomByte(padding)]);
        const encrypted_cdi_data = aes.ige256Encrypt(cdi_data_with_hash, temp_aes_key, temp_aes_iv);
        log('Encrypted CDHI %o %o', encrypted_cdi_data.toString('hex'), encrypted_cdi_data.length); //length final should be 336

        // 6.1 request
        // https://core.telegram.org/mtproto/samples-auth_key#request
        const setClientDHParams = new TL.Proto.set_client_DH_params({
          nonce: nonce,
          server_nonce: server_nonce,
          encrypted_data: encrypted_cdi_data
        });

        // 7 compute authkey
        // https://core.telegram.org/mtproto/samples-auth_key#7-computing-auth-key-using-formula-gab-mod-dh-prime
        const g_a = Integer.fromBuff(serverDHInnerData.g_a, 256, 'big');
        const auth_key = Integer.toBuff(
          BigInt(bigInt(g_a).modPow(b, dh_prime).toString()),
          256,
          'big'
        );
        log('Auth_key %o %o', auth_key.toString('hex'), auth_key.length);

        // 8
        const auth_key_hash = sha1(auth_key).slice(-8);
        log('auth_key_hash', auth_key_hash.toString('hex'), auth_key_hash.length);

        // 9
        const setClientDHParamsAnswer: TL.Proto.Set_client_DH_params_answer = await this.send(
          setClientDHParams
        );
        log('SetClientDHParamsAnswer %o', setClientDHParamsAnswer);

        return auth_key;
      } catch (err) {
        console.log(err);
        log('Getting auth_key retry %o ...', this.retries);
        this.retries -= 1;
        if (this.retries == 0) {
          throw new Error('Creating auth_key failed');
        }
      } finally {
        await this.connection.close();
      }

      await sleep(5000);
    }
  }
}
