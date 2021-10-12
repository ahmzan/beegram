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

import { Int, Long, TLObject } from '../Core';

export class Message {
  msg_id!: bigint;
  seqno!: number;
  bytes!: number;
  body!: any;

  private _offset!: number;
  private _raw!: Buffer;

  constructor(params: MessageParam | Buffer, offset?: number) {
    if (Buffer.isBuffer(params)) {
      this._raw = params.slice(offset);
    } else {
      this.msg_id = params.msg_id;
      this.seqno = params.seqno;
      this.bytes = params.bytes;
      this.body = params.body;
    }
  }

  async read() {
    this._offset = 0;
    this.msg_id = this._read(this._raw, Long);
    this.seqno = this._read(this._raw, Int);
    this.bytes = this._read(this._raw, Int);
    this.body = await TLObject.read(this._raw.slice(this._offset, this.bytes + this._offset));

    return new Message(this);
  }

  async write(): Promise<Buffer> {
    return Buffer.concat([
      Long.write(this.msg_id, true),
      Int.write(this.seqno, true),
      Int.write(this.bytes, true),
      await this.body.write()
    ]);
  }

  private _read(value: Buffer, dataType?: any) {
    const result = dataType.read(value, this._offset);
    const resLen = dataType.write(result).length;
    this._offset += dataType.byteCount || resLen;
    return result;
  }

  static read(data: Buffer, offset: number = 0) {
    return new Message(data, offset).read();
  }

  static write(param: MessageParam) {
    return new Message(param).write();
  }
}

export interface MessageParam {
  msg_id: bigint;
  seqno: number;
  bytes: number;
  body: any;
}
