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

import { Int, Vector } from '../Core';
import { Message } from './Message';

export class MessageContainer {
  messages!: Array<Message>;

  private _id: number = 0x73f1f8dc;
  private _offset!: number;
  private static _offset: number = 0;
  private raw!: Buffer;

  constructor(params: MessageContainerParam | Buffer) {
    if (Buffer.isBuffer(params)) {
      this.raw = params;
    } else {
      this.messages = params.messages;
    }
  }

  async write(): Promise<Buffer> {
    return Buffer.concat([
      Int.write(this._id, true),
      (await Vector.write(this.messages, Message)).slice(4)
    ]);
  }

  async read() {
    this._offset = 0;
    this.messages = await Vector.read(this.raw, 0, Message);

    return new MessageContainer(this);
  }

  private _read(dataType: any, value: any, little: boolean = true) {
    const result = dataType.read(value, this._offset, little);
    this._offset += dataType.byteCount || dataType.encodedLength;
    return result;
  }

  static read(data: Buffer, offset: number = 0) {
    return new MessageContainer(data).read();
  }

  static write(params: MessageContainerParam): Promise<Buffer> {
    return new MessageContainer(params).write();
  }
}

export interface MessageContainerParam {
  messages: Array<Message>;
}
