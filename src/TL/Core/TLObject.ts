import { Int } from './Primitive';
// @ts-ignore
import { tlObject } from '../All';

export class TLObject {
  constructor() {}
  write() {}

  static read(data: Buffer, type?: any) {
    // slice constructor
    const body = data.slice(4);

    const constructId = Int.read(data, 0, true) >>> 0
    const tlClass = tlObject[constructId];

    try {
      if (type) return tlClass.read(body, type);
      return tlClass.read(body);
    } catch (err) {
      return 'type uknown';
    }
  }
}
