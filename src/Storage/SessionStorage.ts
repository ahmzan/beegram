export abstract class SessionStorage {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  open() {}

  save() {}

  close() {}

  delete() {}

  updatePeer() {}

  getPeerById() {}

  getPeerByUsername() {}

  getPeerByPhoneNumber() {}

  abstract dcId(dcId?: number): boolean;

  abstract date(date?: number): boolean;

  abstract testMode(tes?: boolean): Boolean;

  abstract authKey(key?: string): string;

  abstract userId(userId?: number): number;

  abstract isBot(isBot?: boolean): boolean;

  exportSessionString() {}
}
