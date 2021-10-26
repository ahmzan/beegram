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
import debug from 'debug';
import { promisify } from 'util';

const log = debug('Connection:TCPIntermediate');
const sleep = promisify(setTimeout);

export class TCPIntermediate {
  private address: string;
  private port: number;
  private socket: net.Socket;
  private handleDataFn!: (data: Buffer) => Promise<void>;
  private chunks: Array<Buffer> = [];
  private totChunkSize: number = 0;
  private curChunkSize: number = 0;
  private waitAnotherChunk: boolean = false;

  constructor(address: string) {
    this.address = address;
    this.port = 80;
    this.socket = new net.Socket();
  }

  private encode(payload: Buffer) {
    const length = payload.byteLength;
    const lengthBuff = Buffer.alloc(4);
    lengthBuff.writeIntLE(length, 0, 4);
    return Buffer.concat([lengthBuff, payload]);
  }

  private decode(data: Buffer) {
    const length = data.readIntLE(0, 4);
    return data.slice(4, length + 4);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.port, this.address, () => {
        log('Connecting to %s:%s with TCPIntermediate', this.address, this.port);
      });

      this.socket.on('error', (err) => {
        log('Failed to connecting with TCPIntermediate');
        if (err) reject(err);
      });

      this.socket.on('connect', () => {
        log('Connected to %s', this.address);
        this.socket.write(Buffer.from('eeeeeeee', 'hex'));
        resolve(true);
      });
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

  private isAvailable() {
    return this.socket.writable;
  }

  async send(payload: Buffer) {
    return new Promise(async (resolve, reject) => {
      log('Sending data to %s', this.address);
      const encoded = this.encode(payload);
      while (!this.isAvailable()) {
        log('Waiting socket writable');
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

    this.socket.on('data', (chunk) => {
      log('Chunk received from %o', this.address);
      if (chunk.length == 0) return;

      this.totChunkSize = chunk.readUInt32LE();
      this.curChunkSize += this.waitAnotherChunk ? chunk.length : chunk.length - 4;

      if (this.curChunkSize < this.totChunkSize) {
        log('Wait another chunk');
        this.waitAnotherChunk = true;
        this.chunks.push(chunk);
      } else {
        log('Chunk completed');
        this.waitAnotherChunk = false;
        this.chunks.push(chunk);
        const decoded = this.decode(Buffer.concat(this.chunks));
        this.chunks = [];
        this.curChunkSize = 0;
        this.handleDataFn(decoded);
      }
    });
  }
}
