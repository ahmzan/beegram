import * as fs from 'fs';
import { SessionStorage } from './';

export class FileStorage extends SessionStorage {
  database: string;
  storage: any;
  constructor(name: string) {
    super(name);

    this.database = `${this.name}.session`;
    this.storage = {};
  }

  open() {
    const path = this.database;

    if (fs.existsSync(path)) {
      this.storage = JSON.parse(fs.readFileSync(path, 'utf-8'));
    } else {
      this.create();
    }
  }

  close() {
    this.save();
    this.storage = {};
  }

  save() {
    fs.writeFileSync(this.database, JSON.stringify(this.storage));
  }

  create() {
    fs.writeFileSync(this.database, JSON.stringify({}));
  }

  testMode(test?: boolean) {
    if (test == undefined) {
      return this.storage['test-mode'];
    }
    this.storage['test-mode'] = test;
    this.save();
    return this.storage['test-mode'];
  }

  authKey(key?: string) {
    if (key == undefined) {
      return this.storage['auth-key'];
    }
    this.storage['auth-key'] = key;
    this.save();
    return this.storage['auth-key'];
  }

  userId(id?: number) {
    if (id == undefined) {
      return this.storage['user-id'];
    }
    this.storage['user-id'] = id;
    this.save();
    return this.storage['user-id'];
  }

  isBot(is?: boolean) {
    if (is == undefined) {
      return this.storage['is-bot'];
    }
    this.storage['is-bot'] = is;
    this.save();
    return this.storage['is-bot'];
  }

  date(date?: number) {
    if (date == undefined) {
      return this.storage['date'];
    }
    this.storage['dat'] = date;
    this.save();
    return this.storage['date'];
  }

  dcId(dcId?: number) {
    if (dcId == undefined) {
      return this.storage['dc-id'];
    }
    this.storage['dc-id'] = dcId;
    this.save();
    return this.storage['dc-id'];
  }
}
