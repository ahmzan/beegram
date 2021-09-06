import { inputPeerChannel, inputPeerChat, inputPeerUser, InputPeer } from '../TL/Schema';

export abstract class SessionStorage {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Creating and prepare database
   **/
  abstract create(): void;

  /**
   * Delete database storage
   **/
  abstract delete(): void;

  /**
   * Open database storage
   **/
  abstract open(): void;

  /**
   * Close database storage
   **/
  abstract close(): void;

  /**
   * Save database storage
   **/
  abstract save(): void;

  /**
   * Get and Save authkey
   * @return return a Buffer
   **/
  abstract authKey(key?: Buffer): Buffer;

  /**
   * Get and Save date
   * @return return a number
   **/
  abstract date(date?: number): number;

  /**
   * Get and Save dcid
   * @return return a number
   **/
  abstract dcId(dcId?: number): number;

  /**
   * Get and Save isbot
   * @return return a boolean
   **/
  abstract isBot(isBot?: boolean): boolean;

  /**
   * Get and Save testmode
   * @return return a boolean
   **/
  abstract testMode(isTest?: boolean): boolean;

  /**
   * Get and Save userid
   * @return return a number
   **/
  abstract userId(userId?: number): number;

  /**
   * Get peer data by id
   **/
  abstract getPeerById(id: number | bigint): any;

  /**
   * Get peer data by phone number with international format (e.g 1234, 628111)
   **/
  abstract getPeerByPhoneNumber(phone: number): any;

  /**
   * Get peer data by username without @ symbol
   **/
  abstract getPeerByUsername(username: string): any;

  /**
   * Update peer with given data
   **/
  abstract updatePeer(peerData: PeerData): void;

  /**
   * Export session string
   **/
  exportSessionString(): string {
    const version = '1';
    const authKey = this.authKey();

    const buf = Buffer.concat([Buffer.from(version), authKey.reverse()]).reverse();

    return buf.toString('base64');
  }
}

export interface PeerData {
  peer_id: number | bigint;
  access_hash: bigint;
  type: string;
  username?: string;
  phone_number?: number;
}

/**
 * Get input peer
 **/
export function getInputPeer(peer: any): InputPeer {
  if (peer.type == 'user' || peer.type == 'bot')
    return new inputPeerUser({
      user_id: peer.peer_id,
      access_hash: peer.access_hash
    });

  if (peer.type == 'channel' || peer.type == 'supergroup')
    return new inputPeerChannel({
      channel_id: peer.peer_id,
      access_hash: peer.access_hash
    });

  if (peer.type == 'group') return new inputPeerChat({ chat_id: peer.peer_id });

  throw Error('Invalid peer');
}
