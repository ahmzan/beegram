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

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { Integer } from '../Utilities';

const classToLines = (item: Item, withNamespace: boolean = false) => {
  let [nameSpace, className] = (item.method || item.predicate || '').split('.');
  // if (className == undefined) className = nameSpace;
  return `export class ${className ? className : nameSpace}<T extends Buffer | unknown = unknown> {
${paramsToProp(item)}

  private _id: number = 0x${Integer.toBuff(BigInt(item.id), 4, 'big', true).toString('hex')};
  private _offset: number = 0;
  private raw!: Buffer;

  constructor(${paramsToLineConstructor(item)}) {
${paramsToAssignLines(item)}
  }

  async read() {
${paramsToReadLines(item)}
  }

  async write(): Promise<Buffer> {
${paramsToFlag(item)}

${paramsToWriteLines(item)}
  }

  private _read(dataType: any, value: Buffer, ...args: any[]) {
    const result = dataType.read(value, this._offset, ...args);
    const reslen = dataType.write(result, ...args).length;
    this._offset += dataType.byteCount || reslen;
    return result;
  }

  static read(${item.params.length == 0 ? '' : 'data: Buffer, offset: number = 0'}): Promise<${
    className ? className : nameSpace
  }> {
    return new ${className ? className : nameSpace}<Buffer>(${
    item.params.length == 0 ? '' : 'data, offset'
  }).read();
  }

  static write(${
    item.params.length == 0
      ? ''
      : `params: ${className ? `${nameSpace}.${className}` : nameSpace}Param`
  }): Promise<Buffer> {
    return new ${className ? className : nameSpace}(${
    item.params.length == 0 ? '' : 'params'
  }).write();
  }
}

${paramsToInterface(item)}`;
};

const paramsToProp = (item: Item, isInterface: boolean = false) => {
  let params = item.params;
  if (params.length == 0) return '  // no params';
  let propLines = '';
  // flags
  if (params.find((param) => param.name == 'flags')) propLines += '  flags!: number;\n';
  params = params.filter((param) => param.name != 'flags');
  propLines += params
    .map((param) => {
      if (param.type.match(/flags/)) return `  ${param.name}?: ${replaceDatatype(param.type)};`;
      return `  ${param.name}${isInterface ? '' : '!'}: ${replaceDatatype(param.type)};`;
    })
    .join('\n');
  return propLines;
};

const paramsToInterface = (item: Item) => {
  if (item.params.length == 0) return '// no interface params';
  let [nameSpace, className] = (item.method || item.predicate || '').split('.');
  // filter flags
  const items = item;
  items.params = items.params.filter((param) => param.name != 'flags');
  return `export interface ${className ? className : nameSpace}Param {\n${paramsToProp(
    items,
    true
  )}\n}`;
};

const paramsToLineConstructor = (item: Item) => {
  if (item.params.length == 0) return '';
  let className = item.method || item.predicate || '';
  return `params: T extends Buffer ? Buffer : ${className}Param, offset: number = 0`;
};

const paramsToAssignLines = (item: Item) => {
  if (item.params.length == 0) return '    // no assign';
  const params = item.params.filter((param) => param.name != 'flags');
  const assignLines = params.map((i) => `      this.${i.name} = params.${i.name};`).join('\n');
  return `    if (Buffer.isBuffer(params)) {\n      this.raw = params.slice(offset);\n    } else {\n${assignLines}\n    }`;
};

const paramsToReadLines = (item: Item) => {
  let [nameSpace, className] = (item.method || item.predicate || '').split('.');
  let params = item.params;
  if (params.length == 0) return `    return new ${className ? className : nameSpace}();`;
  let readLines = '';
  // flags
  // if (params.find((param) => param.name == 'flags'))
  //   readLines += '    this.flags = this._read(Int, this.raw);\n';
  // params = params.filter((param) => param.name != 'flags');
  readLines += params
    .map((param) => {
      if (param.type.match('flags')) {
        const flagNumber = param.type.match(/[0-9]+/);
        const type = param.type.replace(/flags\.[0-9]+\?/, '');
        if (availablePrimitive[type] != undefined)
          return `    this.${
            param.name
          } = this.flags & (1 << ${flagNumber}) ? this._read(${replacePrimitive(
            param.type
          )}, this.raw) : undefined;`;
        if (/Vector/.test(type)) {
          const typeV = param.type.replace(/(Vector|[<>])/g, '');
          const primitive =
            availablePrimitive[typeV] != undefined
              ? `, ${typeV.replace(/^.{1}/, typeV.charAt(0).toUpperCase())}`
              : '';
          return `    this.${param.name} = this.flags & ( 1 << ${flagNumber}) ? await Vector.read(this.raw, this._offset${primitive}) : undefined;\n    this._offset += this.${param.name} != undefined ? (await Vector.write(this.${param.name}${primitive})).length : 0\n`;
        }
        if (type == 'true')
          return `    this.${param.name} = this.flags & (1 << ${flagNumber}) ? true : undefined;`;
        return `    this.${param.name} = this.flags & (1 << ${flagNumber}) ? await TLObject.read(this.raw, this._offset) : undefined;\n    this._offset += this.${param.name} != undefined ? (await this.${param.name}.write()).length : 0;\n`;
      }
      if (/Vector/.test(param.type)) {
        const typeV = param.type.replace(/(Vector|[<>])/g, '');
        const primitive =
          availablePrimitive[typeV] != undefined
            ? `, ${typeV.replace(/^.{1}/, typeV.charAt(0).toUpperCase())}`
            : '';
        return `    this.${param.name} = await Vector.read(this.raw, this._offset${primitive});\n    this._offset += (await Vector.write(this.${param.name}${primitive})).length;\n`;
      }
      const type = param.type;
      if (availablePrimitive[type] != undefined)
        return `    this.${param.name} = this._read(${replacePrimitive(param.type)}, this.raw);`;
      return `    this.${param.name} = await TLObject.read(this.raw, this._offset);\n    this._offset += (await this.${param.name}.write()).length;\n`;
    })
    .join('\n');
  return `${readLines}\n\n    this.raw = this.raw.slice(0, this._offset);\n    return new ${
    className ? className : nameSpace
  }(this)`;
};

const paramsToFlag = (item: Item) => {
  const params = item.params.filter((param) => /flags/.test(param.type));
  if (params.length == 0) return '    // no flags';
  let flagLines = '    this.flags = 0;\n';
  flagLines += params
    .map((param) => {
      const flagNumber = param.type.match(/[0-9]+/);
      return `    this.flags += this.${param.name} != undefined ? (1 << ${flagNumber}) : 0`;
    })
    .join('\n');
  return flagLines;
};

const paramsToWriteLines = (item: Item) => {
  let params = item.params;
  if (params.length == 0) return `    return Buffer.concat([Int.write(this._id, true)]);`;
  let writeLines = '';
  // flags
  // if (params.find((param) => param.name == 'flags')) writeLines += '      Int.write(this.flags);\n';
  // params = params.filter((param) => param.name != 'flags');
  writeLines = params
    .filter((param) => !/flags/.test(param.type))
    .map((param) => {
      if (param.type.match('flags')) {
        const type = param.type.replace(/flags\.[0-9]+\?/, '');
        if (availablePrimitive[type] != undefined)
          return `      this.${param.name} != undefined ? ${replacePrimitive(
            param.type
          )}.write(this.${param.name}): Buffer.alloc(0)`;
        if (/Vector/.test(type)) {
          const typeV = param.type.replace(/(Vector|[<>])/g, '');
          const primitive =
            availablePrimitive[typeV] != undefined
              ? `, ${typeV.replace(/^.{1}/, typeV.charAt(0).toUpperCase())}`
              : '';
          return `      this.${param.name} != undefined ? await Vector.write(this.${param.name}${primitive}) : Buffer.alloc(0)`;
        }
        if (type == 'true')
          return `      this.${param.name} !=  undefined ? Int.write(0x3fedd339, true) : Buffer.alloc(0)`;
        return `      this.${param.name} != undefined ? await this.${param.name}.write(): Buffer.alloc(0)`;
      }
      if (/Vector/.test(param.type)) {
        const typeV = param.type.replace(/(Vector|[<>])/g, '');
        const primitive =
          availablePrimitive[typeV] != undefined
            ? `, ${typeV.replace(/^.{1}/, typeV.charAt(0).toUpperCase())}`
            : '';
        return `      await Vector.write(this.${param.name}${primitive})`;
      }
      const type = param.type;
      if (availablePrimitive[type] != undefined)
        return `      ${replacePrimitive(param.type)}.write(this.${param.name})`;
      // if (type == 'bytes') return `      this.${param.name}`;
      return `      await this.${param.name}.write()`;
    })
    .join(',\n');
  return `    return Buffer.concat([\n      Int.write(this._id, true),\n${writeLines}\n    ]);`;
};

const availablePrimitive: { [key: string]: string } = {
  int: 'Int',
  long: 'Long',
  int128: 'Int128',
  int256: 'Int256',
  double: 'Double',
  bytes: 'Bytes',
  string: 'Str',
  Bool: 'Bool',
  '#': 'Int'
};

const replacePrimitive = (type: string) => {
  // if (availablePrimitive[type]) return availablePrimitive[type];
  if (/flags\.[0-9]+\?/.test(type)) type = type.replace(/flags\.[0-9]+\?/, '');
  if (/Vector/.test(type)) type = 'Vector';
  return availablePrimitive[type] ? availablePrimitive[type] : type;
};

const availableDatatype: { [key: string]: string } = {
  int: 'number',
  long: 'bigint',
  int128: 'bigint',
  int256: 'bigint',
  bytes: 'Buffer',
  double: 'number',
  Bool: 'boolean',
  '!X': 'any'
};

const replaceDatatype = (type: string): string => {
  // if (availableDatatype[type] != undefined) return availableDatatype[type];
  if (/flags\.[0-9]+\?/.test(type)) type = type.replace(/flags\.[0-9]+\?/, '');
  if (/Vector/.test(type)) return `Array<${replaceDatatype(type.replace(/(Vector|[<>])/g, ''))}>`;
  return availableDatatype[type] ? availableDatatype[type] : type;
};

// prepare
const proto: {
  constructors: Item[];
  methods: Item[];
} = require('./proto.json');

const excludeId = [
  0x688a30aa, // temporary exclude
  0x3fedd339, // true
  0x56730bcc, // null,
  0x1cb5c415, // vector,
  0xbc799737, // boolFalse,
  0x997275b5, // boolTrue
  0x1cb5c415, // vector
  0x73f1f8dc, // msg container,
  0xae500895 // future salts
];

// begin generate
const lines: string[] = [];
const types: { [key: string]: string[] } = {};
const typesX: string[] = [];
const obj: { [key: string]: string } = {};
const protoNamespace: { [key: string]: Item[] } = {};
lines.push(
  "import { Int, Long, Int128, Int256, Double, Bytes, Str, Bool, Vector, TLObject } from './Core';"
);

// generate constructor
proto.constructors.forEach((item) => {
  const id = parseInt(item.id) >>> 0;
  const itemName = item.predicate || '';
  const type = item.type;

  if (excludeId.includes(id)) return;
  if (itemName.split('.').length == 2) {
    const [nameSpace, className2] = itemName.split('.');
    if (protoNamespace[nameSpace] == undefined) protoNamespace[nameSpace] = [item];
    else protoNamespace[nameSpace].push(item);
    return;
  }

  if (types[type] == undefined) types[type] = [itemName];
  else types[type].push(itemName);

  const idHex = Integer.toBuff(BigInt(item.id), 4, 'big', true).toString('hex');
  if (obj[`0x${idHex}`] == undefined) obj[`0x${idHex}`] = itemName;

  lines.push(classToLines(item));
});

lines.push('//==================================================');

// generate methods
proto.methods.forEach((item) => {
  const id = parseInt(item.id) >>> 0;
  const itemName = item.method || '';
  const type = item.type;

  if (excludeId.includes(id)) return;
  if (itemName.split('.').length == 2) {
    const [nameSpace, className2] = itemName.split('.');
    if (protoNamespace[nameSpace] == undefined) protoNamespace[nameSpace] = [item];
    else protoNamespace[nameSpace].push(item);
    return;
  }

  if (type != 'X') {
    if (types[type] == undefined) types[type] = [itemName];
    else types[type].push(itemName);
  } else {
    typesX.push(itemName);
  }

  const idHex = Integer.toBuff(BigInt(item.id), 4, 'big', true).toString('hex');
  if (obj[`0x${idHex}`] == undefined) obj[`0x${idHex}`] = itemName;

  lines.push(classToLines(item));
});

lines.push('//==================================================');

// generate with namespace
Object.keys(protoNamespace).forEach((nameSpace) => {
  const items: Item[] = protoNamespace[nameSpace];
  const nameSpaceLines: string[] = [];
  const typesNamespace: { [key: string]: string[] } = {};

  // generate method in namespace
  items.forEach((item) => {
    const id = parseInt(item.id) >>> 0;
    const itemName = item.method || item.predicate || '';
    const arrType = item.type.split('.');
    const type = arrType.length == 1 ? arrType[0] : arrType[1];

    if (excludeId.includes(id)) return;

    if (!/Vector/.test(item.type)) {
      if (typesNamespace[type] == undefined) typesNamespace[type] = [itemName];
      else typesNamespace[type].push(itemName);
    }

    const idHex = Integer.toBuff(BigInt(item.id), 4, 'big', true).toString('hex');
    if (obj[`0x${idHex}`] == undefined) obj[`0x${idHex}`] = itemName;

    nameSpaceLines.push(classToLines(item));
  });

  // generate type in namespace
  const typesNamespaceLines: string[] = [];
  Object.keys(typesNamespace).forEach((t) => {
    typesNamespaceLines.push(`export type ${t} = ${typesNamespace[t].join(' | ')}`);
  });
  lines.push(
    `export namespace ${nameSpace} {\n${nameSpaceLines.join('\n\n')}\n\n${typesNamespaceLines.join(
      '\n'
    )}\n}`
  );
});

// generate type
const typeLines: string[] = [];
Object.keys(types).forEach((type) => {
  typeLines.push(`export type ${type} = ${types[type].join(' | ')};`);
});
lines.push(typeLines.join('\n'));
lines.push(`export type NotX = ${Object.keys(types).join(' | ')};`);
// for x type
// lines.push(`export type X = ${typesX.join(' | ')};`);
// lines.push(`export type TAll = NotX | X;`);

// generate all object
const objLines: string[] = [];
Object.keys(obj).forEach((key) => {
  objLines.push(`  ${key}: ${obj[key]}`);
});
lines.push(`export const All: {[key: number]: any}= {\n${objLines.join(',\n')}\n};`);

// freeze object
lines.push(`export const AllFreeze = Object.freeze(All);`);

// write output
writeFileSync(resolve(__dirname, '../TL/Proto.ts'), lines.join('\n\n'));

// interface
interface Item {
  id: string;
  predicate?: string;
  method?: string;
  params: { name: string; type: string }[];
  type: string;
}
