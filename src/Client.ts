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

import { APP_VERSION, DEVICE_MODEL, LANG, NOTICE, SYSTEM_VERSION } from './Constant';
import { getSSR } from './Crypto/SSR';
import { Dispatcher } from './Dispatcher';
import { RPCError } from './Errors/RPCError';
import { Auth, Session } from './Session';
import { SessionStorage, SQLiteStorage } from './Storage';
import {
  account,
  auth,
  channel,
  Chat,
  chat,
  codeSettings,
  contacts,
  inputCheckPasswordSRP,
  inputFile,
  InputFile,
  inputFileBig,
  InputPeer,
  inputPeerEmpty,
  inputPeerSelf,
  inputUserSelf,
  messages,
  passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow,
  updates,
  upload,
  User,
  user,
  userFull,
  users
} from './TL/Schema';
import { Middleware, UpdateEventMap } from './Types';
import { Integer, md5 } from './Utilities';
import { createInterface } from 'readline';
import { promisify } from 'util';
import { Messages } from './Methods/Messages';
import { AuthMethod } from './Methods/Auth';
import Debug from 'debug';
import mimelite from 'mime/lite';

const log = Debug('Client');
const debug = Debug('Client:debug');
const input = (text: string) => {
  const inputInterface = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  return new Promise<string>((resolve, reject) => {
    inputInterface.once('SIGINT', () => {
      inputInterface.close();
      reject(new Error('Aborted'));
    });

    inputInterface.question(text, (answer) => {
      inputInterface.close();
      resolve(answer);
    });
  });
};
const sleep = promisify(setTimeout);

export class Client {
  sessionName: string;
  apiId: number;
  apiHash: string;
  dcId: number;
  testMode: boolean;
  userId: number;
  options?: ClientOptions;

  appVersion: string;
  deviceModel: string;
  systemVersion: string = SYSTEM_VERSION;
  langCode: string = LANG;

  botToken: string;
  isBot: boolean;
  phoneNumber?: string;
  phoneCode?: string;
  user!: userFull;

  protected storage!: SessionStorage;
  protected session!: Session;

  dispatcher: Dispatcher;

  isConnected: boolean = false;
  isInitialized: boolean = false;

  randomId: () => bigint = function () {
    return Integer.random(8);
  };
  auth: AuthMethod;
  messages: Messages;

  constructor(
    sessionName: string | SessionStorage,
    apiId: number,
    apiHash: string,
    options?: ClientOptions
  ) {
    log('Initial client');
    if (!options?.noNotice) console.log(NOTICE);

    if (typeof sessionName === 'string') {
      this.storage = new SQLiteStorage(sessionName);
      this.sessionName = this.storage.name;
    } else {
      this.storage = sessionName;
      this.sessionName = this.storage.name;
    }

    this.apiId = apiId;
    this.apiHash = apiHash;
    this.dcId = 2;
    this.testMode = options?.testMode ? options.testMode : false;
    this.userId = 0;
    this.options = options;

    this.appVersion = options?.appVersion ? options.appVersion : APP_VERSION;
    this.deviceModel = options?.deviceModel ? options.deviceModel : DEVICE_MODEL;

    this.botToken = options?.botToken || '';
    this.isBot = this.options?.botToken ? true : false;

    this.dispatcher = new Dispatcher(this);

    this.auth = new AuthMethod(this);
    this.messages = new Messages(this);
  }

  async checkSession() {
    log('Check session');
    this.storage.open();

    try {
      this.storage.authKey();
      this.dcId = this.storage.dcId();
      this.storage.date();
      this.isBot = this.storage.isBot();
      this.testMode = this.storage.testMode();
      this.userId = this.storage.userId();
    } catch (err) {
      log('Session is empty creating new session');
      this.storage.dcId(this.dcId);
      this.storage.date(0);
      this.storage.userId(0);
      this.storage.isBot(this.botToken ? true : false);
      this.storage.testMode(this.testMode);
      this.storage.authKey(await new Auth(this.storage.dcId(), this.storage.testMode()).create());
      log('New session created');
    }
    log('Session loaded');
  }

  /** start and initialize client*/
  async start(): Promise<userFull> {
    log('Start client');
    try {
      await this.connect();
      const isAuthorize = this.storage.userId() == 0 ? false : true;
      log('Is authorize %o', isAuthorize);

      if (!isAuthorize) {
        if (this.isBot) {
          const bot = await this.authorizeWithBot();

          this.storage.userId(bot.id);
          await this.fetchPeers([bot]);
        } else {
          const user = await this.authorize();

          this.storage.userId(user.id);
          await this.fetchPeers([user]);
        }
      }

      const res = await this.send(new updates.getState());
      debug('result getState - %o', res);

      this.user = await this.send(new users.getFullUser({ id: new inputUserSelf() }));

      this.initialize();
      log('Client started');
      return this.user;
    } catch (err: any) {
      if (err instanceof RPCError) {
        if (err.message == 'AUTH_KEY_UNREGISTERED') {
          log('Getting new auth key');
          await this.disconnect();

          const newAuthKey = await new Auth(this.dcId, this.testMode).create();
          this.storage.authKey(newAuthKey);
          this.storage.userId(0);
          return this.start();
        }
      }
      await this.disconnect();
      throw err;
    }
  }

  /** stop and terminate client */
  async stop() {
    log('Stop client');
    await this.disconnect();
    await this.terminate();
    log('Client stoped');
  }

  /** connect to server */
  async connect() {
    if (this.isConnected) {
      log('Client already connected');
      return;
    }
    log('Connecting');
    await this.checkSession();

    this.session = new Session(
      this,
      this.storage.dcId(),
      this.storage.authKey(),
      this.storage.testMode()
    );
    await this.session.start();
    this.isConnected = true;
    log('Connected');
  }

  /** disconect from server */
  async disconnect() {
    log('Disconnecting');
    await this.session.stop();
    this.isConnected = false;
    log('Disconnected');
  }

  initialize() {
    log('Initialize');
    this.isInitialized = true;

    this.dispatcher.start();
    log('Initialized');
  }

  terminate() {
    log('Terminating');
    this.isInitialized = false;

    this.dispatcher.stop();
    log('Terminated');
  }

  /** pause from receive and handling update */
  pause(dropUpdate?: boolean) {
    return this.dispatcher.pause(dropUpdate);
  }

  /* resume receive and handli update */
  resume() {
    return this.dispatcher.resume();
  }

  /** authorizing client as bot */
  async authorizeWithBot(): Promise<user> {
    log('Authorize with bot');

    while (true) {
      try {
        const authorization = await this.auth.importBotAuthorization(
          this.apiId,
          this.apiHash,
          this.botToken
        );
        return authorization.user;
      } catch (err) {
        if (err instanceof RPCError) {
          if (/MIGRATE/.test(err.message)) {
            const [type, dcId] = err.message.split('_MIGRATE_');
            await this.session.stop();

            log('%o Migrating TO %o', type, dcId);
            const newAuthKey = await new Auth(parseInt(dcId), this.testMode).create();

            this.storage.authKey(newAuthKey);
            this.dcId = this.storage.dcId(parseInt(dcId));

            this.session = new Session(this, parseInt(dcId), newAuthKey, this.testMode);
            await this.session.start();
            continue;
          }
        }
        throw err;
      }
    }
  }

  // https://core.telegram.org/api/auth
  /**authorizing client as user */
  async authorize(): Promise<user> {
    log('Authorize');

    try {
      let phoneCodeHash;
      while (true) {
        const inputPhone = await input('Phone number : ');
        this.phoneNumber = inputPhone.replace(/[+ ]/g, '');

        try {
          const sentCode = await this.auth.sendCode(
            this.phoneNumber,
            this.apiId,
            this.apiHash,
            new codeSettings({})
          );
          debug('result sendCode %o', sentCode);
          phoneCodeHash = sentCode.phone_code_hash;
          break;
        } catch (err) {
          if (err instanceof RPCError) {
            if (err.message == 'PHONE_NUMBER_INVALID') {
              console.log('Invalid phone number');
              continue;
            } else if (err.message == 'PHONE_NUMBER_FLOOD') {
              console.log('You asked for the code too many times');
              throw err;
            }
          }
          throw err;
        }
      }

      let authorization;
      while (true) {
        const phoneCode = await input('Code : ');
        this.phoneCode = phoneCode.replace(/[a-zA-Z]+/g, '');

        try {
          authorization = await this.auth.signIn(this.phoneNumber, phoneCodeHash, this.phoneCode);
          debug('result signIn %o', authorization);
          break;
        } catch (err) {
          if (err instanceof RPCError) {
            if (err.message == 'PHONE_CODE_INVALID') {
              console.log(err.message);
              continue;
            } else if (err.message == 'PHONE_CODE_EXPIRED') {
              console.log(err.message);
              continue;
            }
          }
          throw err;
        }
      }

      if (authorization instanceof auth.authorizationSignUpRequired) {
        const isSignup = (
          await input('it seems this number is not registered yet. want to sign up ? [Y/n]')
        ).toLowerCase();
        if (isSignup != 'y') {
          throw new Error('Sign up canceled');
        }

        const firstName = await input('Firstname : ');
        const lastName = await input('Lastname : ');
        const agreement = (
          await input(`${authorization.terms_of_service?.text} I Agree with telegram ToS ? [Y/n]`)
        ).toLowerCase();
        if (agreement != 'y') {
          throw new Error('Sign up canceled');
        }

        authorization = await this.auth.signUp(
          this.phoneNumber,
          phoneCodeHash,
          firstName,
          lastName
        );
        debug('result signUp %o', authorization);
      }

      return authorization.user;
    } catch (err: any) {
      if (err instanceof RPCError) {
        if (err.message == 'SESSION_PASSWORD_NEEDED') {
          return await this.authorizeWithPassword();
        } else if (/MIGRATE/.test(err.message)) {
          const [type, dcId] = err.message.split('_MIGRATE_');
          await this.session.stop();

          log('%o Migrating to %o', type, dcId);
          const newAuthKey = await new Auth(parseInt(dcId), this.testMode).create();

          this.storage.authKey(newAuthKey);
          this.dcId = this.storage.dcId(parseInt(dcId));

          this.session = new Session(this, parseInt(dcId), this.storage.authKey(), this.testMode);
          await this.session.start();
          return await this.authorize();
        } else if (err.message == 'AUTH_RESTART') {
          return await this.authorize();
        }
      }
      log('Authorize failed');
      debug('error %o', err);
      throw err;
    } finally {
      await this.disconnect();
    }
  }

  /** authorizing client as user with 2fa activated */
  async authorizeWithPassword(): Promise<user> {
    log('Authorize with password');

    let authorization;
    while (true) {
      const accPassword: account.password = await this.send(new account.getPassword());
      debug('result getPassword - %o', accPassword);

      const algo = <passwordKdfAlgoSHA256SHA256PBKDF2HMACSHA512iter100000SHA256ModPow>(
        accPassword.current_algo
      );
      const srp_B = <Buffer>accPassword.srp_B;
      const srp_id = <bigint>accPassword.srp_id;

      const password = await input('Password : ');
      const { A, M1 } = getSSR(password, algo, srp_B);

      const inputCheckPassword = new inputCheckPasswordSRP({ A: A, M1: M1, srp_id: srp_id });

      try {
        authorization = await this.send(new auth.checkPassword({ password: inputCheckPassword }));
        debug('result checkPassword %o', authorization);
        break;
      } catch (err) {
        if (err instanceof RPCError) {
          if (err.message == 'PASSWORD_HASH_INVALID') {
            console.log('Password Incorrect. try again');
            continue;
          }
        }
      }
    }

    return authorization.user;
  }

  /** sending directly rpc request to server */
  async send(data: any): Promise<any> {
    log('Send message');
    const result = await this.session.send(data);

    if (result != undefined) {
      if ('users' in result) {
        this.fetchPeers(result.users);
      }
      if ('chats' in result) {
        this.fetchPeers(result.chats);
      }
    }
    return result;
  }

  /** resolve peer from session storage */
  async resolvePeer(peerId: number | string): Promise<InputPeer> {
    log('Resolve peer');
    debug('peer_id %o', peerId);
    if (typeof peerId == 'string') {
      if (peerId == 'me' || peerId == 'self') return new inputPeerSelf();

      try {
        return this.storage.getPeerByUsername(peerId.replace('@', ''));
      } catch (err) {
        const resolvePeer: contacts.resolvedPeer = await this.send(
          new contacts.resolveUsername({ username: peerId })
        );

        if ('users' in resolvePeer) {
          await this.fetchPeers(resolvePeer.chats);
        }
        if ('users' in resolvePeer) {
          await this.fetchPeers(resolvePeer.users);
        }
        return this.resolvePeer(peerId);
      }
    }
    if (typeof peerId == 'number') {
      try {
        return this.storage.getPeerById(peerId);
      } catch (err) {
        try {
          return this.storage.getPeerByPhoneNumber(peerId);
        } catch (err) {
          const dialogs: messages.Dialogs = await this.send(
            new messages.getDialogs({
              hash: 0,
              limit: 10,
              offset_date: Math.floor(Date.now() / 1000),
              offset_id: 0,
              offset_peer: new inputPeerEmpty()
            })
          );

          if (dialogs instanceof messages.dialogs || dialogs instanceof messages.dialogsSlice) {
            const { chats, users } = dialogs;
            await Promise.all([this.fetchPeers(chats), this.fetchPeers(users)]);
          }

          return this.resolvePeer(peerId);
        }
      }
    }

    throw Error('Cannot resolve peer');
  }

  /** fetching peers, saving to storage session */
  async fetchPeers(peers: User[] | Chat[]): Promise<void> {
    log('Fetching peers');
    peers.forEach((peer: any) => {
      if (peer instanceof user) {
        const { id, access_hash, username, phone } = peer;
        const type = peer.bot ? 'bot' : 'user';

        this.storage.updatePeer({
          peer_id: id,
          access_hash: <bigint>access_hash,
          type: type,
          phone_number: phone,
          username: username
        });
      }

      if (peer instanceof chat) {
        const { id } = peer;
        this.storage.updatePeer({ peer_id: id, type: 'group', access_hash: 0n });
      }

      if (peer instanceof channel) {
        const { id, access_hash, username } = peer;
        const type = peer.broadcast ? 'channel' : 'supergroup';

        this.storage.updatePeer({
          peer_id: id,
          access_hash: <bigint>access_hash,
          type: type,
          username: username
        });
      }
    });
  }

  /** uploading file to server */
  async uploadFile(file: Buffer, filename: string): Promise<InputFile> {
    log('Upload file');
    /*     
    part_size % 1024 = 0 (divisible by 1KB)
    524288 % part_size = 0 (512KB must be evenly divisible by part_size)
    */
    const file_id = this.randomId();
    const part_size = 524288;
    const partCount = Math.ceil(file.length / part_size);
    debug('upload %o part from size %o', partCount, file.length);

    let offset = 0;
    for (var i = 0; i < partCount; i++) {
      const chunk = file.slice(offset, i + 1 == partCount ? file.length : offset + part_size);
      const res = await this.send(
        new upload.saveFilePart({
          bytes: chunk,
          file_id: file_id,
          file_part: i
        })
      );
      offset += part_size;

      debug(`part ${i}`, res);
    }
    debug('file id', file_id);
    if (file.length > 10 * 1024 * 1024) {
      return new inputFileBig({ id: file_id, name: filename, parts: partCount });
    }

    const md5hash = md5(file).toString('hex');
    debug('file hash %o', md5hash);
    return new inputFile({ id: file_id, md5_checksum: md5hash, name: filename, parts: partCount });
  }

  /** getting mime type from extension*/
  getMimeType(ext: string) {
    return mimelite.getType(ext) ?? 'application/octet-stream';
  }

  /** getting extension from mime */
  getExtension(mime: string) {
    return mimelite.getExtension(mime) ?? '';
  }

  /** catching all midleware error */
  catch(fn: (err: any) => void | Promise<void>) {
    this.dispatcher.catchError(fn);
  }

  /** register function for handle event update */
  on<K extends keyof UpdateEventMap>(eventName: K | K[], fn: Middleware<UpdateEventMap[K]>) {
    if (!Array.isArray(eventName)) eventName = [eventName];

    eventName.forEach((name) => {
      this.dispatcher.addListener(name, fn);
    });
  }

  /** unregister function from handle event update */
  off<K extends keyof UpdateEventMap>(eventName: K | K[], fn: Middleware<UpdateEventMap[K]>) {
    if (!Array.isArray(eventName)) eventName = [eventName];

    eventName.forEach((name) => {
      this.dispatcher.removeListener(name, fn);
    });
  }
}

interface ClientOptions {
  botToken?: string;
  appVersion?: string;
  deviceModel?: string;
  langCode?: string;
  testMode?: boolean;
  noNotice?: boolean;
}
