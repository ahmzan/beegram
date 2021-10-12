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

import { resolve } from 'path';
import os from 'os';

const pkg = require(resolve(__dirname, '../package.json'));
export const NOTICE =
  'beegram is released under license LGPLv3,\n' +
  'Copyright (C) 2021 Ahmzan <https://github.com/ahmzan>\n';

export const APP_VERSION = `beegram ${pkg.version}`;
export const DEVICE_MODEL = `NodeJS ${process.version}`;
export const LANG = 'en';
export const SYSTEM_VERSION = `${os.platform()} ${os.release()}`;
export const VERSION = pkg.version;
