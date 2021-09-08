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

import { Datacenter } from './Datacenter';
import { TransportError } from '../Errors/Transport';
import { TCPAmbridge, TCPIntermediate } from './Transport/TCP/';
import { promisify } from 'util';
import debug from 'debug';

const log = debug('Connection');
const wait = promisify(setTimeout);

export class Connection {
  dcId: number;
  testMode: boolean;
  address: string;
  protocol: 'TCP' | 'WS' | 'HTTP';
  transport!: TCPAmbridge | TCPIntermediate;
  retries: number;
  mode: 'TCPAmbridge' | 'TCPIntermediate' | 'TCPFull';
  constructor(dcId: number, testMode: boolean) {
    log('Init connection %o %o', dcId, testMode);
    this.dcId = dcId;
    this.testMode = testMode;

    this.address = Datacenter(this.dcId, testMode);
    this.protocol = 'TCP';
    this.mode = 'TCPAmbridge';

    this.retries = 5;
  }

  async connect() {
    for (var i = 1; i <= this.retries; i++) {
      this.transport = new TCPIntermediate(this.address);

      if (i == this.retries)
        throw Error('Fail connecting to server please check your internet connection');
      try {
        log('Connecting to %s', this.address);
        await this.transport.connect();
        break;
      } catch (err) {
        log('Failed to connect %o', err);
        await this.transport.close();
        console.log(err.message, 'Retriying');
        await wait(2000);
      }
    }
  }

  async close() {
    log('Disconnecting from %s', this.address);
    await this.transport.close();
  }

  async send(payload: Buffer) {
    log('Sending payload');
    await this.transport.send(payload);
  }

  onData(fn: (data: Buffer) => Promise<void>) {
    this.transport.onData(fn);
  }

  async receive() {
    const payload = await this.transport.receive();
    log('Receving payload');
    if (payload.length == 4) {
      const errCode = payload.readInt32LE().toString();
      if (errCode == '-404') {
        throw new TransportError('404 Incorrect query');
      }
      throw new TransportError(errCode);
    }
    return payload;
  }
}
