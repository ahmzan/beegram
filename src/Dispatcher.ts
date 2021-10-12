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

import { Client } from './Client';
import { Context } from './Context';
import { BaseEvent } from './Events/BaseEvent';
import { Middleware, UpdateEvent, UpdateEventMap } from './Types';
import * as schema from './TL/Schema';
import Debug from 'debug';

const log = Debug('Dispatcher');
const debug = Debug('Dispatcher:debug');

export class Dispatcher<T extends Record<string, any> = UpdateEventMap> {
  events: { [K in keyof T]?: Array<Middleware<T[K]>> } = {};
  queue: schema.Updates[] = [];
  stackEvent: BaseEvent<any>[] = [];

  isStarted: boolean = false;
  isPaused: boolean = false;
  dropUpdate: boolean = false;
  updateJob!: NodeJS.Timeout;

  errorHandler: (err: any) => void | Promise<void> = (err: any) => {
    console.log('Unhandled error', err);
  };

  constructor(readonly client: Client) {}

  start() {
    log('Starting Dispatcher');
    this.isStarted = true;
  }

  stop() {
    log('Stopping dispatcher');
    this.isStarted = false;
    this.events = {};
  }

  pause(dropUpdate: boolean = true) {
    log('Pause dispacther');
    this.isPaused = true;
    this.dropUpdate = dropUpdate;
  }

  resume() {
    log('Resume dispatcher');
    this.isPaused = false;
    this.dropUpdate = false;
    this.processQueue();
  }

  addListener<K extends keyof UpdateEventMap>(eventName: K, fn: Middleware<T[K]>) {
    log('Add %o listener', eventName);
    this.events[eventName] =
      this.events[eventName] == undefined ? [fn] : this.events[eventName]?.concat(fn);
  }

  removeListener<K extends keyof UpdateEventMap>(eventName: K, fn: Middleware<T[K]>) {
    log('Remove %o listener', eventName);
    if (this.events[eventName] != undefined) {
      this.events[eventName] = this.events[eventName]?.filter((mid) => mid != fn);
    }
  }

  removeAllListener<K extends keyof UpdateEventMap>(eventName: K) {
    log('Remove all listener');
    this.events[eventName] = [];
  }

  addHandler<T extends UpdateEvent>(...eventHandler: BaseEvent<T>[]) {
    return this.stackEvent.push(...eventHandler) - 1;
  }

  enqueue(update: any) {
    log('Enqueue update');
    return this.queue.push(update);
  }

  dequeue() {
    log('Dequeue update');
    return this.queue.shift();
  }

  async processQueue() {
    log('Process queue');
    if (this.queue.length == 0) return;
    while (this.queue.length > 0) {
      const rawUpdate = this.dequeue();
      if (rawUpdate == undefined) return;
      await this.handle(rawUpdate);
    }
  }

  async handle(rawUpdate: schema.Updates) {
    log('Handle');
    debug('raw update %o', rawUpdate);

    let updates: any[] = [rawUpdate];
    if (rawUpdate instanceof schema.updateShort) {
      updates = [rawUpdate.update];
    }
    if (rawUpdate instanceof schema.updates) {
      updates = rawUpdate.updates;
    }

    for (var j = 0; j < updates.length; j++) {
      const update = updates[j];

      const midStack = this.events[update['_']] ? this.events[update['_']] : this.events['*'];
      const context = new Context<any>(this.client, update);

      if (midStack) {
        let prevIndex = -1;

        const runner = async (index: number) => {
          if (index == prevIndex) throw new Error('next() called multiple time');

          prevIndex = index;

          const mid = midStack[index];
          if (mid !== undefined) {
            try {
              await mid(context, () => {
                return runner(index + 1);
              });
            } catch (err) {
              return await this.errorHandler(err);
            }
          }
        };

        await runner(0);
      }
    }
  }

  handleUpdate(rawUpdate: schema.Updates): void {
    log('Handle update');
    debug('update %o', rawUpdate);

    if (!this.isStarted) return;

    if (this.isPaused) {
      if (this.dropUpdate) return;
      this.enqueue(rawUpdate);
      return;
    }

    this.enqueue(rawUpdate);
    this.processQueue();
  }

  catchError(fn: (err: any) => void | Promise<void>) {
    this.errorHandler = fn;
  }
}
