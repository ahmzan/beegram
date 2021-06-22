import { TCPAmbridge } from './Transport/TCP/TCPAmbridge';

function getDcAddress(dcId: number, test?:number): string {
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

    this.retries = 5;
    console.log('Creating connection');
  }

  async connect() {
    for (var i = 0; i < this.retries; i++) {
      this.transport = new TCPAmbridge(this.address);

      try {
        console.log('Connecting to', this.address);
        await this.transport.connect();
        break;
      } catch (err) {
        console.log('Failed connect', err);
        this.transport.close();
        continue;
      }
    }
  }

  async close() {
    console.log('Disconnecting from ', this.address);
    await this.transport.close();
  }

  async send(payload: Buffer) {
    await this.transport.send(payload);
  }

  async receive() {
    return await this.transport.receive();
  }
}