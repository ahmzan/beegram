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

import { Context } from './Context';
import * as schema from './TL/Schema';

export type UnionKeys<T> = T extends unknown ? keyof T : never;

export type OfUnion<T extends { _: string }> = {
  [P in T['_']]: Extract<T, { _: P }>;
};

export type OptionalPropertyOf<T> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K;
  }[keyof T],
  undefined
>;

export type OptionalOf<T extends object> = Pick<T, OptionalPropertyOf<T>>;

// =================
type WithoutReadWrite<T> = Omit<T, 'read' | 'write'>;

export type Middleware<T extends UpdateEvent> = (
  context: Context<T>,
  next: () => Promise<void>
) => Promise<void> | void;

export type UpdateEventMap = OfUnion<UpdateEvent>;

export type UpdateEvent = Exclude<
  schema.Update | schema.Updates,
  schema.updateShort | schema.updates
>;

export type EventMap = Record<string, any>;

// export type RawUpdateEvent = schema.Update

export type UpdateMessage =
  | schema.updateShortMessage
  | schema.updateNewMessage
  | schema.updateNewChannelMessage;

export enum ChatType {
  private = 'user',
  group = 'group',
  channel = 'channel',
  supergroup = 'supergroup'
}
