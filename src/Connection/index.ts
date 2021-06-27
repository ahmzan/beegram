import { TransportError } from '../Errors/Transport';
import { TCPAmbridge } from './Transport/TCP/TCPAmbridge';
import debug from 'debug';

const log = debug('Connection');

function getDcAddress(dcId: number, test?: number): string {
  return '149.154.167.40';
}

export class Connection {
  dcId: number;
  testMode: boolean;
  address: string;
  protocol: 'TCP' | 'WS' | 'HTTP';
  transport: TCPAmbridge;
  retries: number;
  mode: 'TCPAmbridge' | 'TCPIntermediate' | 'TCPFull';
  constructor(dcId: number, testMode: boolean) {
    this.dcId = dcId;
    this.testMode = testMode;

    this.address = getDcAddress(this.dcId);
    this.protocol = 'TCP';
    this.mode = 'TCPAmbridge';
    this.transport = new TCPAmbridge(this.address);

    this.retries = 5;
    log('Creating connection')
  }

  async connect() {
    for (var i = 0; i < this.retries; i++) {
      this.transport = new TCPAmbridge(this.address);

      try {
        log('Connecting to %s', this.address);
        await this.transport.connect();
        break;
      } catch (err) {
        log('Failed to connect %o', err);
        this.transport.close();
        continue;
      }
    }
  }

  async close() {
    log('Disconnecting from %s', this.address);
    await this.transport.close();
  }

  async send(payload: Buffer) {
    log('Sending payload')
    await this.transport.send(payload);
  }

  async receive() {
    const payload = await this.transport.receive();
    log('Receving payload')
    if (payload.length == 4) {
      throw new TransportError(payload.readInt32LE().toString());
    }
    return payload;
  }
}
