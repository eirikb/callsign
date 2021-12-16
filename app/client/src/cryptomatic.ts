const publicKeyAlgorithm = "RSA-OAEP";
const secretKeyAlgorithm = "AES-GCM";
const hashAlgorithm = "SHA-256";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function fetchKey(callsign: string) {
  return fetch(`https://${callsign}/${callsign}.key`).then((r) => r.text());
}

export async function generateKeys() {
  return window.crypto.subtle.generateKey(
    {
      name: publicKeyAlgorithm,
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: hashAlgorithm,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportPrivateKey(privateKey) {
  const privKOut = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(privKOut);
}

export async function exportPublicKey(publicKey) {
  const pubKOut = await window.crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(pubKOut);
}

export async function importPrivateKey(privateKey) {
  const privK = base64ToArrayBuffer(privateKey);
  return window.crypto.subtle.importKey(
    "pkcs8",
    privK,
    {
      name: publicKeyAlgorithm,
      hash: hashAlgorithm,
    },
    false,
    ["decrypt"]
  );
}

export async function importPublicKey(publicKey) {
  const pubK = base64ToArrayBuffer(publicKey);
  return window.crypto.subtle.importKey(
    "spki",
    pubK,
    {
      name: publicKeyAlgorithm,
      hash: hashAlgorithm,
    },
    false,
    ["encrypt"]
  );
}

export async function encrypt(publicKey, text) {
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: publicKeyAlgorithm,
    },
    publicKey,
    new TextEncoder().encode(text)
  );
  return arrayBufferToBase64(encrypted);
}

export async function decrypt(privateKey, base64) {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: publicKeyAlgorithm,
    },
    privateKey,
    base64ToArrayBuffer(base64)
  );
  return new TextDecoder().decode(decrypted);
}

export async function generateSecretKey() {
  return window.crypto.subtle.generateKey(
    {
      name: secretKeyAlgorithm,
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportSecretKey(key) {
  const kOut = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(kOut);
}

export async function importSecretKey(keyString) {
  const key = base64ToArrayBuffer(keyString);
  return window.crypto.subtle.importKey(
    "raw",
    key,
    {
      name: secretKeyAlgorithm,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function secretEncrypt(secretKey, text) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: secretKeyAlgorithm,
      iv,
    },
    secretKey,
    new TextEncoder().encode(text)
  );
  return [arrayBufferToBase64(iv), arrayBufferToBase64(encrypted)];
}

export async function secretDecrypt(secretKey, iv, base64) {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: secretKeyAlgorithm,
      iv: base64ToArrayBuffer(iv),
    },
    secretKey,
    base64ToArrayBuffer(base64)
  );
  return new TextDecoder().decode(decrypted);
}
