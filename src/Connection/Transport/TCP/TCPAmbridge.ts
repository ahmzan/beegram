import * as net from 'net';
import { getBufferFromNumber, getNumberFromBuffer } from '../../../Utilities';
import debug from 'debug';

const log = debug('Connection:TCP');

export class TCPAmbridge {
  address: string;
  port: number;
  socket: net.Socket;
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

  async send(payload: Buffer) {
    return new Promise((resolve, reject) => {
      log('Sending data to %s', this.address);
      const encoded = this.encode(payload);
      const result = this.socket.write(encoded, (err) => {
        if (err) reject(err);
      });

      resolve(result);
    });
  }

  async receive(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.socket.on('data', (data) => {
        log('Receiving data from %s', this.address);
        const decoded = this.decode(data);

        resolve(decoded);
      });
    });
  }
}
