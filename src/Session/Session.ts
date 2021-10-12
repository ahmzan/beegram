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

import { Client } from '../Client';
import { Connection } from '../Connection';
import { RPCError } from '../Errors/RPCError';
import { RequestTimeout } from '../Errors/Timeout';
import { Long, TLObject } from '../TL/Core';
import { Message } from '../TL/Proto/Message';
import { MessageContainer } from '../TL/Proto/MessageContainer';
import { Integer, sha1, sha256 } from '../Utilities';
import bigInt from 'big-integer';
import Debug from 'debug';
import zlib from 'zlib';
import * as aes from '../Crypto/AES';
import * as schema from '../TL/Schema';
import * as proto from '../TL/Proto';

const log = Debug('Session');
const debug = Debug('Session:debug');

export class Session {
  client: Client;
  dcId: number;
  authKey: Buffer;
  testMode: boolean;

  authKeyId: Buffer;
  sessionId: bigint = Integer.random(8);
  serverSalt: bigint = Integer.random(8);
  lastMsgId: bigint = 0n;
  lastSeqnoSent: number = 0;
  timeOffset: number = 0;

  connection!: Connection;
  messageWaitResponse: Map<bigint, WaitResponseObject> = new Map();

  queue: Array<QueueObject> = [];

  pingJob!: NodeJS.Timeout;
  lastPingId!: bigint;

  constructor(client: Client, dcId: number, authKey: Buffer, testMode: boolean) {
    log('Initial session');

    this.client = client;
    this.dcId = dcId;
    this.authKey = authKey;
    this.testMode = testMode;

    this.authKeyId = sha1(this.authKey).slice(-8);
  }

  async start(): Promise<void> {
    log('Starting session');
    this.connection = new Connection(this.dcId, this.testMode);

    try {
      await this.connection.connect();
      this.connection.onData(this.onMessage.bind(this));

      const badServerSalt: proto.bad_server_salt = await this.send(new proto.ping({ ping_id: 0n }));
      debug('ping0 - %o', badServerSalt);

      this.serverSalt = badServerSalt.new_server_salt;

      const response = await this.send(new proto.ping({ ping_id: 1n }));
      debug('ping1 - %o', response);

      const res = await this.send(
        new schema.invokeWithLayer({
          layer: 121,
          query: new schema.initConnection({
            api_id: this.client.apiId,
            app_version: this.client.appVersion,
            device_model: this.client.deviceModel,
            lang_code: this.client.langCode,
            lang_pack: '',
            system_lang_code: 'en',
            system_version: this.client.systemVersion,
            query: new schema.help.getConfig()
          })
        })
      );
      debug('invoke help config - %o', res);

      log('Session created');
      log(
        'Device: %o - %o | System %o - %o',
        this.client.deviceModel,
        this.client.appVersion,
        this.client.systemVersion,
        this.client.langCode
      );
    } catch (err) {
      await this.connection.close();
      throw err;
    }
    log('Session started');

    this.lastPingId = 2n;
    this.pingJob = setInterval(() => {
      this.send(new proto.ping({ ping_id: this.lastPingId })).then((res) => {
        log('Internal pong');
        debug('Internal pong result %o', res);
        this.lastPingId++;
      });
    }, 7000).unref();
  }

  async stop() {
    log('Stoping session');
    await this.connection.close();
    log('Clear Ping Job');
    clearInterval(this.pingJob);
    log('Session stopped');
  }

  private async getServerSalt() {
    // this.serverSalt = Buffer.from('616e67656c696361', 'hex');
    log('Current serversalt %o', this.serverSalt);
    const res = await this.send(new proto.get_future_salts({ num: 1 }));
    log('Getting serversalt %s', res);
  }

  private getMsgId(): bigint {
    log('Geting msg_id with offset %o', this.timeOffset);
    const time = Date.now();
    const timeSec = Math.floor(time / 1000) + this.timeOffset;
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

  private getSeqNo(isContentRelated: boolean = true) {
    let seqNo = this.lastSeqnoSent * 2 + (isContentRelated ? 1 : 0);

    if (isContentRelated) {
      this.lastSeqnoSent += 1;
      // seqNo += 1;
    }
    log('Get seq_no %o, %o', seqNo, this.lastSeqnoSent);
    return seqNo;
  }

  // https://core.telegram.org/mtproto/description#schematic-presentation-of-messages
  private async encryptMessage(message: Message): Promise<Buffer> {
    log('Encrypt message');
    debug('message %o', message);
    const msgBuf = await message.write();

    const toBeEncrypted = Buffer.concat([
      Long.write(this.serverSalt, true),
      Long.write(this.sessionId, true),
      msgBuf
    ]);
    debug('To be encrypted %o, %o', toBeEncrypted.toString('hex'), toBeEncrypted.length);

    const padding = 16 - ((toBeEncrypted.length + 12) % 16) + 12;
    debug('Padding %o', padding);

    const toBeEncryptedWithPadding = Buffer.concat([toBeEncrypted, Buffer.alloc(padding)]);

    const msg_key_large = sha256(
      Buffer.concat([this.authKey.slice(88, 88 + 32), toBeEncryptedWithPadding])
    );
    debug('msg_key_large %o %o', msg_key_large.toString('hex'), msg_key_large.length);

    const msg_key = msg_key_large.slice(8, 8 + 16);
    debug('msg_key %o %o', msg_key.toString('hex'), msg_key.length);

    const { aesKey, aesIv } = this.KDF(msg_key, true);

    const encrypted_data = aes.ige256Encrypt(toBeEncryptedWithPadding, aesKey, aesIv);
    debug('encrypted_data %o %o', encrypted_data.toString('hex'), encrypted_data.length);

    const encrypted_message = Buffer.concat([this.authKeyId, msg_key, encrypted_data]);
    debug('encrypted_message %o %o', encrypted_message.toString('hex'), encrypted_message.length);

    log('Message encrypted');
    return encrypted_message;
  }

  private async decryptMessage(encryptedMessage: Buffer): Promise<Message> {
    log('Decrypt message');
    debug('message %o %o', encryptedMessage.toString('hex'), encryptedMessage.length);

    const auth_key_id = encryptedMessage.slice(0, 8);
    debug('auth_key_id %o %o', auth_key_id.toString('hex'), auth_key_id.length);

    const msg_key = encryptedMessage.slice(8, 8 + 16);
    debug('msg_key %o %o', msg_key.toString('hex'), msg_key.length);

    const encrypted_data = encryptedMessage.slice(24);
    debug('encrypted_data %o %o', encrypted_data.toString('hex'), encrypted_data.length);

    const { aesKey, aesIv } = this.KDF(msg_key, false);

    const decrypted_data = aes.ige256Decrypt(encrypted_data, aesKey, aesIv);
    debug('decrypted_data %o %o', decrypted_data.toString('hex'), decrypted_data.length);

    // checking messagekey
    const msg_key_large = sha256(
      Buffer.concat([this.authKey.slice(88 + 8, 88 + 8 + 32), decrypted_data])
    );
    const msg_key2 = msg_key_large.slice(8, 8 + 16);
    log(
      'Checking msg_key %o %o is same ? %o',
      msg_key.toString('hex'),
      msg_key2.toString('hex'),
      msg_key.equals(msg_key2)
    );
    if (!msg_key.equals(msg_key2)) throw new Error('msg_key not same');

    const serverSalt = Long.read(decrypted_data.slice(0, 8));
    debug('server_salt %o', serverSalt);

    const sessionId = Long.read(decrypted_data.slice(8, 16));
    debug('session_id %o', sessionId);

    log('Message decrypted');
    return await Message.read(decrypted_data.slice(16));
  }

  private KDF(msg_key: Buffer, out: boolean = true) {
    log('Procces KDF');
    const x = out ? 0 : 8;

    const sha256_a = sha256(Buffer.concat([msg_key, this.authKey.slice(x, x + 36)]));
    debug('sha256_a %o %o', sha256_a.toString('hex'), sha256_a.length);

    const sha256_b = sha256(Buffer.concat([this.authKey.slice(40 + x, 40 + x + 36), msg_key]));
    debug('sha256_b %o %o', sha256_b.toString('hex'), sha256_b.length);

    const aes_key = Buffer.concat([
      sha256_a.slice(0, 8),
      sha256_b.slice(8, 8 + 16),
      sha256_a.slice(24, 24 + 8)
    ]);
    debug('aes_key %o %o', aes_key.toString('hex'), aes_key.length);

    const aes_iv = Buffer.concat([
      sha256_b.slice(0, 8),
      sha256_a.slice(8, 8 + 16),
      sha256_b.slice(24, 24 + 8)
    ]);
    debug('aes_iv %o %o', aes_iv.toString('hex'), aes_iv.length);

    log('KDF done');
    return { aesKey: aes_key, aesIv: aes_iv };
  }

  async send(data: any): Promise<any> {
    log('Send message');
    debug('message %o', data);

    let isRelated = true;
    if (
      data instanceof proto.ping ||
      data instanceof proto.http_wait ||
      data instanceof proto.msgs_ack ||
      data instanceof MessageContainer
    )
      isRelated = false;

    const message = new Message({
      msg_id: this.getMsgId(),
      seqno: this.getSeqNo(isRelated),
      bytes: (await data.write()).length,
      body: data
    });

    return new Promise((resolve, reject) => {
      log('Enqueue message %o', message.msg_id);
      this.queue.push({ message, resolve, reject });
      this.proccessQueue();
    }).then(async (result) => {
      if (result instanceof proto.gzip_packed) {
        log('Unpack packet');
        const unpacked = zlib.gunzipSync(result.packed_data);
        const msg = await TLObject.read(unpacked);
        debug('message %o', msg);
        return msg;
      }

      if (result instanceof proto.rpc_error) {
        throw new RPCError(result);
      }
      return result;
    });
  }

  proccessQueue() {
    if (this.queue.length == 0) return;

    while (this.queue.length > 0) {
      const queue = this.queue.shift();
      if (queue == undefined) return;

      const requestTimeout = () => {
        this.messageWaitResponse.delete(queue.message.msg_id);
        queue.reject(new RequestTimeout());
      };

      this.messageWaitResponse.set(queue.message.msg_id, {
        resolve: queue.resolve,
        reject: queue.reject,
        timer: setTimeout(requestTimeout, 10000)
      });
      this._send(queue.message);
    }
  }

  private async _send(message: Message): Promise<void> {
    log('_Send message');
    debug('message %o', message);

    const encryptedMessage = await this.encryptMessage(message);
    debug('encrypted_message %o %o', encryptedMessage.toString('hex'), encryptedMessage.length);

    log('Sending encrypted message');
    await this.connection.send(encryptedMessage);
  }

  private async onMessage(data: Buffer): Promise<void> {
    log('Handle received message');
    debug('message %o %o', data.toString('hex'), data.length);

    const message = await this.decryptMessage(data);
    debug('decrypted_message %o', message);

    let messages: Message[] = [message];
    if (message.body instanceof MessageContainer) {
      messages = message.body.messages;
    }

    for (var i = 0; i < messages.length; i++) {
      let msg = messages[i];
      let msgId = msg.msg_id;

      if (msg.seqno == 0) {
        this.timeOffset =
          Math.floor(Date.now() / 1000) - parseInt((msg.msg_id / 2n ** 32n).toString());
      }

      if (
        msg.body instanceof proto.bad_server_salt ||
        msg.body instanceof proto.bad_msg_notification
      )
        msgId = msg.body.bad_msg_id;

      if (msg.body instanceof proto.pong) msgId = msg.body.msg_id;
      if (msg.body instanceof proto.new_session_created) continue;
      if (msg.body instanceof proto.rpc_result) msgId = msg.body.req_msg_id;

      const waitResponse = this.messageWaitResponse.get(msgId);
      if (waitResponse != undefined) {
        log('Response msg_id  %o', msgId);

        if (msg.body instanceof proto.rpc_result) {
          log('Resolving message rpc_result');
          debug('message %o', msg.body.result);

          clearTimeout(waitResponse.timer);
          waitResponse.resolve(msg.body.result);
        } else {
          log('Resolving message');
          debug('message %o', msg.body);

          clearTimeout(waitResponse.timer);
          waitResponse.resolve(msg.body);
        }
        this.messageWaitResponse.delete(msgId);
      } else {
        log('Server sends a message');
        debug('message %o', msg.body);
        this.client.dispatcher.handleUpdate(msg.body);
      }
    }
  }
}

type WaitResponseObject = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer: NodeJS.Timeout;
};

type QueueObject = {
  message: Message;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

/**
 * @TODO: Handle bad msg notification
16: msg_id too low (most likely, client time is wrong; it would be worthwhile to synchronize it using msg_id notifications and re-send the original message with the “correct” msg_id or wrap it in a container with a new msg_id if the original message had waited too long on the client to be transmitted)
17: msg_id too high (similar to the previous case, the client time has to be synchronized, and the message re-sent with the correct msg_id)
18: incorrect two lower order msg_id bits (the server expects client message msg_id to be divisible by 4)
19: container msg_id is the same as msg_id of a previously received message (this must never happen)
20: message too old, and it cannot be verified whether the server has received a message with this msg_id or not
32: msg_seqno too low (the server has already received a message with a lower msg_id but with either a higher or an equal and odd seqno)
33: msg_seqno too high (similarly, there is a message with a higher msg_id but with either a lower or an equal and odd seqno)
34: an even msg_seqno expected (irrelevant message), but odd received
35: odd msg_seqno expected (relevant message), but even received
48: incorrect server salt (in this case, the bad_server_salt response is received with the correct salt, and the message is to be re-sent with it)
64: invalid container.
**/
