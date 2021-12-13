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

export async function generateKey() {
  return window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
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
      name: "RSA-OAEP",
      hash: "SHA-256",
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
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );
}

export async function encrypt(publicKey, text) {
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    new TextEncoder().encode(text)
  );
  return arrayBufferToBase64(encrypted);
}

export async function decrypt(privateKey, base64) {
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    base64ToArrayBuffer(base64)
  );
  return new TextDecoder().decode(decrypted);
}
