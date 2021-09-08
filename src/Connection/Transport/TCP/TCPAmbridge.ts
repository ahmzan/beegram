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

import * as net from 'net';
import { getBufferFromNumber, getNumberFromBuffer } from '../../../Utilities';
import debug from 'debug';
import { promisify } from 'util';

const log = debug('Connection:TCPAmbridge');
const sleep = promisify(setTimeout);

export class TCPAmbridge {
  address: string;
  port: number;
  socket: net.Socket;
  handleDataFn!: (data: Buffer) => Promise<void>;

  constructor(address: string) {
    this.address = address;
    this.port = 80;
    this.socket = new net.Socket();
  }

  encode(payload: Buffer) {
    const length = payload.byteLength / 4;
    if (length >= 127) {
      return Buffer.concat([
        Buffer.from('7f', 'hex'),
        getBufferFromNumber(length, 3, true),
        payload
      ]);
    }
    return Buffer.concat([Buffer.alloc(1, length), payload]);
  }

  decode(data: Buffer) {
    if (data[0] == 0x7f) {
      const length = getNumberFromBuffer(data.slice(1, 3), true) * 4;
      return data.slice(4, length + 4);
    }
    const length = data.readUInt8(0) * 4;
    return data.slice(1, length + 1);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.port, this.address, () => {
        log('Connecting to %s:%s with TCPAbdrigde', this.address, this.port);
      });

      this.socket.on('error', (err) => {
        log('Failed to connecting with TCPAmbridge');
        if (err) reject(err);
      });

      this.socket.on('connect', () => {
        log('Connected to %s', this.address);
        this.socket.write(Buffer.from('ef', 'hex'));
        resolve(true);
      });

      // this.socket.on('data', (da) => console.log(da));
    });
  }

  async close() {
    return new Promise((resolve, reject) => {
      if (!this.socket.destroyed) {
        log('Closing socket %s', this.address);
        this.socket.destroy();
      }
      log('Socket closed');
      resolve(true);
    });
  }

  isAvailable() {
    return this.socket.writable;
  }

  async send(payload: Buffer) {
    return new Promise(async (resolve, reject) => {
      log('Sending data to %s', this.address);
      const encoded = this.encode(payload);
      while (!this.isAvailable()) {
        log('Waitign socket writable');
        await sleep(500);
      }
      if (this.isAvailable()) {
        const result = this.socket.write(encoded, (err) => {
          if (err) reject(err);
        });

        resolve(result);
      }
    });
  }

  async receive(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.socket.once('data', (data) => {
        if (data.length != 0) {
          log('Receiving data from %s', this.address);
          const decoded = this.decode(data);

          resolve(decoded);
        }
      });
    });
  }

  onData(fn: (data: Buffer) => Promise<void>) {
    this.handleDataFn = fn;
    this.socket.on('data', (data) => {
      if (data.length != 0) {
        log('Data received from %o', this.address);
        const decoded = this.decode(data);

        fn(decoded);
      }
    });
  }
}
