import { getInputPeer, PeerData, SessionStorage } from './SessionStorage';
import { InputPeer } from '../TL/Schema';
import { unlinkSync } from 'fs';
import BetterSqlite3 from 'better-sqlite3';
import debug from 'debug';

const log = debug('SQLiteStorage');

/**
 * a class that stores session data in sqlite
 **/
export class SQLiteStorage extends SessionStorage {
  protected db!: BetterSqlite3.Database;
  constructor(name: string) {
    super(name);

    this.name += '.session';
    this.open();
  }

  create() {
    this.db.exec(
      'CREATE TABLE IF NOT EXISTS session (id TEXT, value TEXT); CREATE TABLE IF NOT EXISTS peers (peer_id INTEGER PRIMARY KEY, type TEXT, access_hash INTEGER, username TEXT, phone_number INTEGER);'
    );
  }

  delete() {
    unlinkSync(this.name);
  }

  open() {
    if (!this.db?.open) this.db = BetterSqlite3(this.name, { verbose: log });
    this.create();
  }

  close() {
    this.db.close();
  }

  save() {}

  authKey(key?: Buffer): Buffer {
    if (key != undefined) {
      const rst = this.db.prepare("SELECT value FROM session WHERE id = 'auth_key'").get();
      if (!rst)
        this.db
          .prepare(`INSERT INTO session (id, value) VALUES ('auth_key', ?)`)
          .run(key.toString('hex'));
      else
        this.db
          .prepare(`UPDATE session SET value = ? WHERE id = 'auth_key'`)
          .run(key.toString('hex'));
    }

    const rst = this.db.prepare("SELECT value FROM session WHERE id = 'auth_key'").get()?.value;
    if (rst) return Buffer.from(rst, 'hex');
    throw Error('authkey empty');
  }

  date(date?: number): number {
    if (date != undefined) {
      const rst = this.db.prepare("SELECT value FROM session WHERE id = 'date'").get();
      if (!rst) this.db.prepare(`INSERT INTO session (id, value) VALUES ('date', ${date})`).run();
      else this.db.prepare(`UPDATE session SET value = ${date} WHERE id = 'date'`).run();
    }

    const rst = this.db.prepare("SELECT value FROM session WHERE id = 'date'").get()?.value;
    if (rst) return parseInt(rst);
    throw Error('date empty');
  }

  dcId(id?: number): number {
    if (id != undefined) {
      const rst = this.db.prepare("SELECT value FROM session WHERE id = 'dc_id'").get();
      if (!rst) this.db.prepare(`INSERT INTO session (id, value) VALUES ('dc_id', ${id})`).run();
      else this.db.prepare(`UPDATE session SET value = ${id} WHERE id = 'dc_id'`).run();
    }

    const rst = this.db.prepare("SELECT value FROM session WHERE id = 'dc_id'").get()?.value;
    if (rst) return parseInt(rst);
    throw Error('dcid empty');
  }

  isBot(isBot?: boolean): boolean {
    if (isBot != undefined) {
      const rst = this.db.prepare("SELECT value FROM session WHERE id = 'is_bot'").get();
      if (!rst)
        this.db
          .prepare(`INSERT INTO session (id, value) VALUES ('is_bot', ${isBot ? 1 : 0})`)
          .run();
      else this.db.prepare(`UPDATE session SET value = ${isBot ? 1 : 0} WHERE id = 'is_bot'`).run();
    }

    const rst = this.db.prepare("SELECT value FROM session WHERE id = 'is_bot'").get()?.value;
    if (rst) return rst == '1' ? true : false;
    throw Error('isbot empty');
  }

  testMode(test?: boolean): boolean {
    if (test != undefined) {
      const rst = this.db.prepare("SELECT value FROM session WHERE id = 'test_mode'").get();
      if (!rst)
        this.db
          .prepare(`INSERT INTO session (id, value) VALUES ('test_mode', ${test ? 1 : 0})`)
          .run();
      else
        this.db.prepare(`UPDATE session SET value = ${test ? 1 : 0} WHERE id = 'test_mode'`).run();
    }

    const rst = this.db.prepare("SELECT value FROM session WHERE id = 'test_mode'").get()?.value;
    if (rst) return rst == '1' ? true : false;
    throw Error('testmode empty');
  }

  userId(userId?: number): number {
    if (userId != undefined) {
      const rst = this.db.prepare("SELECT value FROM session WHERE id = 'user_id'").get();
      if (!rst)
        this.db.prepare(`INSERT INTO session (id, value) VALUES ('user_id', ${userId})`).run();
      else this.db.prepare(`UPDATE session SET value = ${userId} WHERE id = 'user_id'`).run();
    }

    const rst = this.db.prepare("SELECT value FROM session WHERE id = 'user_id'").get()?.value;
    if (rst) return parseInt(rst);
    return 0;
  }

  getPeerById(id: number): InputPeer {
    const peerData = this.db.prepare(`SELECT * FROM peers WHERE peer_id = ${id}`).get();

    return getInputPeer(peerData);
  }

  getPeerByPhoneNumber(phone: number): InputPeer {
    const peerData = this.db.prepare(`SELECT * FROM peers WHERE phone_number = ${phone}`).get();

    return getInputPeer(peerData);
  }

  getPeerByUsername(username: string): InputPeer {
    const peerData = this.db.prepare('SELECT * FROM peers WHERE username = ?').get(username);

    return getInputPeer(peerData);
  }

  updatePeer(peerData: PeerData) {
    this.db
      .prepare(
        `REPLACE INTO peers (peer_id, access_hash, type, username, phone_number) VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        peerData.peer_id,
        peerData.access_hash,
        peerData.type,
        peerData.username,
        peerData.phone_number
      );
  }
}
