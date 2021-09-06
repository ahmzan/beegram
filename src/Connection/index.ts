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
