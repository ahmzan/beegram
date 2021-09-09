import { Int, TLObject } from '../Core';

export class Vector {
  count: number = 0;
  data: any[] = [];
  type!: any;

  private _id: number = 0x1cb5c415;
  private _offset: number = 0;
  private raw!: Buffer;

  constructor(data: Buffer | any[], offset: number = 0, type?: any) {
    if (data instanceof Buffer) {
      this.raw = data.slice(offset);
      this.type = type;
    } else {
      this.count = data.length;
      this.data = data;
      this.type = type;
    }
  }

  async read(): Promise<any[]> {
    const tempRaw = this.raw;
    if (tempRaw.readUInt32LE() == this._id) this.raw = this.raw.slice(4); // check if come with construct
    this.count = await this._read(Int, this.raw);
    for (var i = 0; i < this.count; i++) {
      try {
        let result: any;
        if (this.type) {
          result = await this._read(this.type, this.raw);
        } else {
          result = await TLObject.read(this.raw, this._offset);
          this._offset += (await result.write()).length;
        }
        this.data.push(result);
      } catch (err) {
        this.data.push(err);
      }
    }
    return this.data;
  }

  async write(): Promise<Buffer> {
    const bufData = await Promise.all(
      this.data.map(async (d) => {
        // for buffer
        if (Buffer.isBuffer(d)) return d;
        // for object
        if (this.type) return this.type.write(d);
        // for class
        return await d.write();
      })
    );

    return Buffer.concat([Int.write(this._id, true), Int.write(this.count, true), ...bufData]);
  }

  private async _read(dataType: any, value: Buffer) {
    const result = await dataType.read(value, this._offset);
    const reslen = (await dataType.write(result)).length;
    this._offset += dataType.byteCount || reslen;
    return result;
  }

  static read(data: Buffer, offset: number = 0, type?: any) {
    return new Vector(data, offset, type).read();
  }

  static write(arrData: any[], type?: any): Promise<Buffer> {
    return new Vector(arrData, 0, type).write();
  }
}
