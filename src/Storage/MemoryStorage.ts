import { SQLiteStorage } from './SQLiteStorage';
import BetterSqlite3 from 'better-sqlite3';
import debug from 'debug';

const log = debug('MemoryStorage');

/**
 * a class that stores session data in memory with sqlite
 **/
export class MemoryStorage extends SQLiteStorage {
  constructor() {
    super(':memory:');
  }
  /**
   * Open database storage
   **/
  open() {
    if (!this.db?.open) this.db = BetterSqlite3(this.name, { verbose: log, memory: true });
    this.create();
  }
}
