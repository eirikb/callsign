// FML - like for real
import {
  exportPrivateKey,
  exportPublicKey,
  importPublicKey,
  secretDecrypt,
} from "./cryptomatic";

if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

import * as c from "./cryptomatic";

// const exportSecretKey = (key) => window.crypto.subtle.exportKey("raw", key);

const create = async (signKeys) => {
  // const signKeys = await generateSignKeys();
  const deriveKeys = await c.generateDeriveKeys();
  return {
    deriveKey(publicKey) {
      return c.derive(publicKey, deriveKeys.privateKey);
    },
    publicKey() {
      return deriveKeys.publicKey;
    },
    publicSignKey() {
      return signKeys.publicKey;
    },
    sign(key) {
      return c.sign(signKeys.privateKey, key);
    },
    verify(publicKey, signature, encoded) {
      return c.verify(publicKey, signature, encoded);
    },
  };
};

// TEST KEYS BE NOT AFRAID OF THE GIT LOG YOU HAVE NOT HACKED ANYTHING YET BUT KEEP TRYING I BELIEVE IN YOU
const aliceKeys = {
  publicKey:
    "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEZdK+OQ5ciSFbLgvShJdYOZTxG/TkVGMKbp1v3EVkpUJhw9Yni5A01DEwFn8NCI3WCsH1yoWRgAhiTnDgZOGssb5fDdaK7ogy/IxX/B4l5MCXVf7wPaxUEcfhhvKQcPQ7",
  privateKey:
    "MIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDBqYlNlIDTeRMf6iLKaMiKJmSkp3p71lkNdcAiq/EW2sq/3JcQctbbeFe9kPFI/zjWhZANiAARl0r45DlyJIVsuC9KEl1g5lPEb9ORUYwpunW/cRWSlQmHD1ieLkDTUMTAWfw0IjdYKwfXKhZGACGJOcOBk4ayxvl8N1oruiDL8jFf8HiXkwJdV/vA9rFQRx+GG8pBw9Ds=",
};

// TEST KEYS BE NOT AFRAID OF THE GIT LOG YOU HAVE NOT HACKED ANYTHING YET BUT KEEP TRYING I BELIEVE IN YOU
const bobKeys = {
  publicKey:
    "MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEoG3+qYo1SxkAdj41qj7T3/i+oSsCEHLh29ldJDVXHQ9zkSzWSJlRDiVH4rdTIElzz7aI4Hxk3vW4OdJFRXRrkV3mBXvLB3Y2mRFUhmLIiVe50U5UNR5DvUZp/MsPXmdN",
  privateKey:
    "MIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDD0+qQyNHU3FtZZrHI+9nepT5kNQHOzCQNW9mcPZ3UFgmps4pQcmpQEU+HcuTsKJIGhZANiAASgbf6pijVLGQB2PjWqPtPf+L6hKwIQcuHb2V0kNVcdD3ORLNZImVEOJUfit1MgSXPPtojgfGTe9bg50kVFdGuRXeYFe8sHdjaZEVSGYsiJV7nRTlQ1HkO9Rmn8yw9eZ00=",
};

const importKeys = async (keys) => ({
  privateKey: await c.importPrivateKey(keys.privateKey),
  publicKey: await c.importPublicKey(keys.publicKey),
});

(async () => {
  const alice = await create(await importKeys(aliceKeys));
  const bob = await create(await importKeys(bobKeys));

  const bobKey = await bob.deriveKey(alice.publicKey());
  const aliceKey = await alice.deriveKey(bob.publicKey());

  console.log("bobKey   ", await c.exportSecretKey(bobKey));
  console.log("aliceKey ", await c.exportSecretKey(aliceKey));

  const bobExportedKey = await c.exportSecretKey(bobKey);
  console.log("exported", bobExportedKey);
  const signed = await alice.sign(bobExportedKey);
  console.log("signed", signed);

  console.log(
    "Verified:",
    await bob.verify(alice.publicSignKey(), signed, bobExportedKey)
  );

  const [iv, encrypted] = await c.encrypt(bobKey, "Hello, world!");
  console.log(iv, "::", encrypted);
  const decrypted = await c.decrypt(aliceKey, iv, encrypted);
  console.log("decrypted", decrypted);

  // console.log("ex", await exportSecretKey(key));
  // const signature = await sign(signKeys.privateKey, await exportSecretKey(key));
  // console.log("signature", signature);
  //
  // console.log(
  //   await verify(signKeys.publicKey, signature, await exportSecretKey(key))
  // );

  // const [a, b] = await c.secretEncrypt(key, "Hello, world!");
  // console.log(a, b);
  // console.log(await c.secretDecrypt(key, a, b));
})();
