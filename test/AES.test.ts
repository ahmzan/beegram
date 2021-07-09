import * as AES from '../src/Crypto/AES';

describe('Testing aes ige encryption', () => {
  const key = Buffer.from(
    '5a2a481086667835d6e80e0a0028410bf9b3597512ce37c95ddcec8f2df22c29',
    'hex'
  );
  const iv = Buffer.from(
    '3e920e6fc711eb11523ebb73abdca09b4090604509f7d31fba7ed605d94a0fd8',
    'hex'
  );

  const plain = Buffer.from(
    'cdab3a95c5e880233e9db043be314fdb48a34429e5d23d4a635cf5a97cffb67478c2f487a6ae0a1102ee9adf54a459256bd6428500193211d1f6c2a91ff2d6966b156209d8518faa4c972822093ac063fae2171052ed989b35d00f579ce7480356cf3b702af10aa1fe30a4c1ae7fed918a298984563a9c174d84383792af36e23da35bd72d3d550e07f1259ef376f63f507ba06969e611ef6f9c90d7e0b9ade8c7016cdb44bcb13f36f03feba32e85b35bcb9762d34b8549bcd4d4561f36778e3b43846a52de34a6c63c517a2cf72f6977dc051dcddf76f4014d9f9d1774582c26bd9253912e79f4c991d7f2f2f6b3ab5d4b48ed2a66eedf1e02c30c03c78100',
    'hex'
  );
  const cipherBuff = Buffer.from(
    '1fe02abd8d15ecab0420516638eea3f3af56635d72992f3a2171332918511607831b5301064eb6dd24e44b1fd6f73cdd1b414550d81aed8e71cd93a70979e9db4c7b36d6e8ec193694c074480b842ede43c6941c763a60fba7a81af72407b8adc86c380a5e7229b256009de82ad3e693f741dac339773abeef52a6b385877d9023badadb8adf4c13d1deac465fd876791eb6b3d40f9e6f7b16dbf44af615690298e64788792f0027177ae4806b6e47048eaddc8afc40a774eb689567582acdbd96f3a5da56ae2af179e4969310705918157cfd59a3b606e5520136721f3c248f0ae3928deef029f2c61d1c3907b99484f69cd81f6086151646327af5bf9a20e7',
    'hex'
  );

  const encrypted = AES.ige256Encrypt(plain, key, iv);
  const decrypted = AES.ige256Decrypt(encrypted, key, iv);

  it('encrypted should be same with cipher', () => {
    expect(encrypted).toEqual(cipherBuff);
  });

  it('decrypted should be same with plain', () => {
    expect(decrypted).toEqual(plain);
  });
});
