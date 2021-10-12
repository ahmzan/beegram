import { Client } from '../Client';
import { Session } from '../Session';
import { auth, codeSettings, inputCheckPasswordSRP } from '../TL/Schema';
import debug from 'debug';

const log = debug('Method:Auth');

export class AuthMethod {
  constructor(readonly client: Client) {}

  // auth.sendCode#a677244f phone_number:string api_id:int api_hash:string settings:CodeSettings = auth.SentCode;
  async sendCode(phoneNumber: string, apiId: number, apiHash: string, settings: codeSettings) {
    log('Send code');
    return this.client.send(
      new auth.sendCode({
        phone_number: phoneNumber,
        api_hash: apiHash,
        api_id: apiId,
        settings: settings
      })
    );
  }

  // auth.signUp#80eee427 phone_number:string phone_code_hash:string first_name:string last_name:string = auth.Authorization;
  async signUp(phoneNumber: string, phoneCodeHash: string, firstName: string, lastName: string) {
    log('Sign up');
    return this.client.send(
      new auth.signUp({
        first_name: firstName,
        last_name: lastName,
        phone_code_hash: phoneCodeHash,
        phone_number: phoneNumber
      })
    );
  }

  // auth.signIn#bcd51581 phone_number:string phone_code_hash:string phone_code:string = auth.Authorization;
  async signIn(phoneNumber: string, phoneCodeHash: string, phoneCode: string) {
    log('Sign in');
    return this.client.send(
      new auth.signIn({
        phone_code: phoneCode,
        phone_code_hash: phoneCodeHash,
        phone_number: phoneNumber
      })
    );
  }

  // auth.logOut#5717da40 = Bool;
  async logOut() {
    log('Log out');
    return this.client.send(new auth.logOut());
  }

  // auth.resetAuthorizations#9fab0d1a = Bool;
  async resetAuthorization() {}

  // auth.exportAuthorization#e5bfffcd dc_id:int = auth.ExportedAuthorization;
  async exportAuthorization() {}

  // auth.importAuthorization#e3ef9613 id:int bytes:bytes = auth.Authorization;
  async importAuthorization() {}

  // auth.bindTempAuthKey#cdd42a05 perm_auth_key_id:long nonce:long expires_at:int encrypted_message:bytes = Bool;
  async bindTempAuthKey() {}

  // auth.importBotAuthorization#67a3ff2c flags:int api_id:int api_hash:string bot_auth_token:string = auth.Authorization;
  async importBotAuthorization(apiId: number, apiHash: string, botAuthToken: string) {
    return this.client.send(
      new auth.importBotAuthorization({
        api_hash: apiHash,
        api_id: apiId,
        bot_auth_token: botAuthToken
      })
    );
  }

  // auth.checkPassword#d18b4d16 password:InputCheckPasswordSRP = auth.Authorization;
  async checkPassword(password: inputCheckPasswordSRP) {
    return this.client.send(new auth.checkPassword({ password: password }));
  }

  // auth.requestPasswordRecovery#d897bc66 = auth.PasswordRecovery;
  async requestPasswordRecovery() {}

  // auth.recoverPassword#4ea56e92 code:string = auth.Authorization;
  async recoverPassword() {}

  // auth.resendCode#3ef1a9bf phone_number:string phone_code_hash:string = auth.SentCode;
  async resendCode() {}

  // auth.cancelCode#1f040578 phone_number:string phone_code_hash:string = Bool;
  async cancelCode() {}

  // auth.dropTempAuthKeys#8e48a188 except_auth_keys:Vector<long> = Bool;
  async dropTempAuthKey() {}

  // auth.exportLoginToken#b1b41517 api_id:int api_hash:string except_ids:Vector<int> = auth.LoginToken;
  async exportLoginToken() {}

  // auth.importLoginToken#95ac5ce4 token:bytes = auth.LoginToken;
  async importLoginToken() {}

  // auth.acceptLoginToken#e894ad4d token:bytes = Authorization;
  async acceptLoginToken() {}
}
