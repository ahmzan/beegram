import { IGE } from '@cryptography/aes';

export function ige256Decrypt(cipher: Buffer, key: Buffer, iv: Buffer) {
  const aes = new IGE(key, iv);

  const decrypted = aes.decrypt(cipher);
  return convertUInt32ToBuff(decrypted);
}

export function ige256Encrypt(plain: Buffer, key: Buffer, iv: Buffer) {
  const aes = new IGE(key, iv);

  return convertUInt32ToBuff(aes.encrypt(plain));
}

export function convertUInt32ToBuff(arr: Uint32Array) {
  const buff = Buffer.alloc(arr.length * 4);

  for (var i = 0; i < arr.length; i++) {
    buff.writeUInt32BE(arr[i], i * 4);
  }
  return buff;
}
