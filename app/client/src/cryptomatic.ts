const secretKeyAlgorithm = "AES-GCM";
const signAlgorithm = {
  name: "ECDSA",
  namedCurve: "P-384",
};
const deriveAlgorithm = {
  name: "ECDH",
  namedCurve: "P-384",
};

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
  return fetch(
    `https://${callsign}/${callsign}.key?inyourfacecache=${Date.now()}`
  ).then((r) => r.text());
}

export async function generateDeriveKeys() {
  return window.crypto.subtle.generateKey(deriveAlgorithm, true, ["deriveKey"]);
}

export async function exportPrivateKey(privateKey) {
  const privKOut = await window.crypto.subtle.exportKey("pkcs8", privateKey);
  return arrayBufferToBase64(privKOut);
}

export async function exportPublicKey(publicKey) {
  const pubKOut = await window.crypto.subtle.exportKey("spki", publicKey);
  return arrayBufferToBase64(pubKOut);
}

export async function importPrivateSignKey(privateKey) {
  const privK = base64ToArrayBuffer(privateKey);
  return window.crypto.subtle.importKey("pkcs8", privK, signAlgorithm, false, [
    "sign",
  ]);
}

export async function derive(publicKey, privateKey) {
  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: publicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function importPublicKey(publicKey, usage: KeyUsage, algorithm: any) {
  const pubK = base64ToArrayBuffer(publicKey);
  return window.crypto.subtle.importKey("spki", pubK, algorithm, false, [
    usage,
  ]);
}

export async function importPublicDeriveKey(publicKey) {
  return importPublicKey(publicKey, "deriveKey", deriveAlgorithm);
}

export async function importPublicSignKey(publicKey) {
  return importPublicKey(publicKey, "verify", signAlgorithm);
}

export async function generateSignKeys() {
  return window.crypto.subtle.generateKey(signAlgorithm, true, [
    "sign",
    "verify",
  ]);
}

export async function exportSecretKey(key) {
  const kOut = await window.crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(kOut);
}

export async function sign(privateKey, encoded: string): Promise<string> {
  const signature = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-384" },
    },
    privateKey,
    base64ToArrayBuffer(encoded)
  );
  return arrayBufferToBase64(signature);
}

export async function verify(publicKey, signature: string, encoded: string) {
  return window.crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: { name: "SHA-384" },
    },
    publicKey,
    base64ToArrayBuffer(signature),
    base64ToArrayBuffer(encoded)
  );
}

export async function encrypt(secretKey, text) {
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

export async function decrypt(secretKey, iv, base64) {
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

export function getRandomString(byteLength: number) {
  return arrayBufferToBase64(
    window.crypto.getRandomValues(new Uint8Array(byteLength))
  );
}
