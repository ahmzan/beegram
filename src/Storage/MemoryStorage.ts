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
