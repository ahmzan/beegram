import * as net from 'net';
import debug from 'debug';
import { promisify } from 'util';

const log = debug('Connection:TCPIntermediate');
const sleep = promisify(setTimeout);

export class TCPIntermediate {
  address: string;
  port: number;
  socket: net.Socket;
  constructor(address: string) {
    this.address = address;
    this.port = 80;
    this.socket = new net.Socket();
  }

  encode(payload: Buffer) {
    const length = payload.byteLength;
    const lengthBuff = Buffer.alloc(4);
    lengthBuff.writeIntLE(length, 0, 4);
    return Buffer.concat([lengthBuff, payload]);
  }

  decode(data: Buffer) {
    const length = data.readIntLE(0, 4);
    return data.slice(4, length + 4);
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.connect(this.port, this.address, () => {
        log(
          'Connecting to %s:%s with TCPIntermediate',
          this.address,
          this.port
        );
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
      while (!this.isAvailable) {
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
      this.socket.on('data', (data) => {
        if (data.length != 0) {
          log('Receiving data from %s', this.address);
          const decoded = this.decode(data);

          resolve(decoded);
        }
      });
    });
  }
}
