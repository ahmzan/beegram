import { coreObject } from '../All';
import * as Proto from '../Proto';
import * as Schema from '../Schema';
import debug from 'debug';

const log = debug('TLObject');

export class TLObject {
  obj: { [key: number]: any };
  data: Buffer;
  args: any[];

  constructor(data: Buffer, offset: number = 0, ...args: any[]) {
    this.data = data.slice(offset);
    this.args = args;

    this.obj = Object.assign({}, coreObject, Schema.All, Proto.All);
  }

  async read() {
    const constructId = this.data.readUInt32LE();
    log('Contruct id %o', constructId);

    const tlClass = this.obj[constructId];
    log(tlClass);

    const body = this.data.slice(4);
    return tlClass.read(body, 0, ...this.args);
  }

  async write(): Promise<Buffer> {
    return Promise.resolve(Buffer.alloc(0));
  }

  static read(data: Buffer, offset: number = 0, ...args: any[]): Promise<any> {
    return new TLObject(data, offset, ...args).read();
  }
}
