import { Int } from './';

export class boolFalse {
  _: 'boolFalse' = 'boolFalse';
  // no params

  private _id: number = 0xbc799737;

  constructor() {
    // no assign
  }

  async read() {
    return new boolFalse();
  }

  async write(): Promise<Buffer> {
    // no flags

    return Buffer.concat([Int.write(this._id, true)]);
  }

  static read(): Promise<boolFalse> {
    return new boolFalse().read();
  }

  static write(): Promise<Buffer> {
    return new boolFalse().write();
  }
}

// no interface params

export class boolTrue {
  _: 'boolTrue' = 'boolTrue';
  // no params

  private _id: number = 0x997275b5;

  constructor() {
    // no assign
  }

  async read() {
    return new boolTrue();
  }

  async write(): Promise<Buffer> {
    // no flags

    return Buffer.concat([Int.write(this._id, true)]);
  }

  static read(): Promise<boolTrue> {
    return new boolTrue().read();
  }

  static write(): Promise<Buffer> {
    return new boolTrue().write();
  }
}
