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

export function Datacenter(dcId: number, test?: boolean): string {
  const TEST: { [key: number]: string } = {
    1: '149.154.175.10',
    2: '149.154.167.40',
    3: '149.154.175.117'
  };

  const PROD: { [key: number]: string } = {
    1: '149.154.175.53',
    2: '149.154.167.50',
    3: '149.154.175.100',
    4: '149.154.167.91',
    5: '91.108.56.130'
  };

  if (test) {
    if (TEST[dcId] == undefined) throw Error(`Datacenter ${dcId} is not available for test mode`);
    return TEST[dcId];
  }
  if (PROD[dcId] == undefined)
    throw Error(`Datacenter ${dcId} is not available for production mode`);
  return PROD[dcId];
}
