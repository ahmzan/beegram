import { getInputPeer, PeerData, SessionStorage } from './SessionStorage';
import { InputPeer } from '../TL/Schema';
import debug from 'debug';
import * as fs from 'fs';

const log = debug('FileStorage');

/**
 * a class that stores session data in file
 **/
export class FileStorage extends SessionStorage {
  path!: string;
  db: any;
  constructor(name: string) {
    super(name);

    this.path = name.endsWith('/') ? name : name + '/';
    this.open();
  }

  /**
   * Checking folder data
   **/
  open() {
    if (!fs.existsSync(this.path)) this.create();
  }

  close() {}

  save() {}

  /**
   * Create a folder data
   **/
  create() {
    fs.mkdirSync(this.name);
  }

  /**
   * Destroy folder data
   **/
  delete() {
    fs.unlinkSync(this.name);
  }

  /**
   * Get and Save authkey
   * @return return a Buffer
   **/
  authKey(key?: Buffer): Buffer {
    if (key != undefined) {
      fs.writeFileSync(this.path + 'authkey', key.toString());
    }

    return Buffer.from(fs.readFileSync(this.path + 'authkey', 'utf-8'));
  }

  /**
   * Get and Save date
   * @return return a number
   **/
  date(date?: number): number {
    if (date != undefined) {
      fs.writeFileSync(this.path + 'date', date.toString());
    }

    return parseInt(fs.readFileSync(this.path + 'date', 'utf-8'));
  }

  /**
   * Get and Save dcid
   * @return return a number
   **/
  dcId(dcId?: number): number {
    if (dcId != undefined) {
      fs.writeFileSync(this.path + 'dcid', dcId.toString());
    }

    return parseInt(fs.readFileSync(this.path + 'dcid', 'utf-8'));
  }

  /**
   * Get and Save isbot
   * @return return a boolean
   **/
  isBot(isBot?: boolean): boolean {
    if (isBot != undefined) {
      fs.writeFileSync(this.path + 'isbot', isBot.toString());
    }

    return fs.readFileSync(this.path + 'isbot', 'utf-8') == 'true' ? true : false;
  }

  /**
   * Get and Save testmode
   * @return return a boolean
   **/
  testMode(test?: boolean) {
    if (test != undefined) {
      fs.writeFileSync(this.path + 'testmode', test.toString());
    }

    return fs.readFileSync(this.path + 'testmode', 'utf-8') == 'true' ? true : false;
  }

  /**
   * Get and Save userid
   * @return return a number
   **/
  userId(userId?: number): number {
    if (userId != undefined) {
      fs.writeFileSync(this.path + 'dcid', userId.toString());
    }

    return parseInt(fs.readFileSync(this.path + 'dcid', 'utf-8'));
  }

  /**
   * Get peer data by id
   **/
  getPeerById(id: number): InputPeer {
    const peerData = this.db.prepare(`SELECT * FROM peers WHERE peer_id = ${id}`).get();

    return getInputPeer(peerData);
  }

  /**
   * Get peer data by phone number with international format (e.g 1234, 628111)
   **/
  getPeerByPhoneNumber(phone: number): InputPeer {
    const peerData = this.db.prepare(`SELECT * FROM peers WHERE phone_number = ${phone}`).get();

    return getInputPeer(peerData);
  }

  /**
   * Get peer data by username without @ symbol
   **/
  getPeerByUsername(username: string): InputPeer {
    const peerData = this.db.prepare('SELECT * FROM peers WHERE username = ?').get(username);

    return getInputPeer(peerData);
  }

  /**
   * Update peer with given data
   **/
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
