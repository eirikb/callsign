// @ts-ignore
import crypto from "crypto";
import { scrypt as scryptJs } from "scrypt-js";
import { data } from "./dd";

const algorithm = "sha512";
const cipherAlgorithm = "aes-256-cbc";
const ecdh = crypto.createECDH("secp521r1");

async function scrypt(password: Buffer): Promise<Buffer> {
  const N = 1024;
  const r = 8;
  const p = 1;
  const dkLen = 32;
  return scryptJs(password, Buffer.from(""), N, r, p, dkLen).then((res) =>
    Buffer.from(res)
  );
}

export function fetchCert(callsign: String) {
  return fetch(` https://${callsign}/${callsign}.crt`).then((res) =>
    res.text()
  );
}

export function normalize(name: string) {
  return name.replace(/\./g, "__");
}

export function normalizeKey(key: string) {
  const bah = "-----";
  const parts = key.split(bah).filter((w) => w);
  return [
    bah + parts[0] + bah,
    parts[1].replace(/ /g, "\n"),
    bah + parts[2] + bah,
  ].join("");
}

export function verifyCert(cert: string, key: string) {
  try {
    const message = "Hello, world!";
    const sign = crypto.createSign(algorithm);
    sign.update(message);
    const sig = sign.sign(key);
    const verify = crypto.createVerify(algorithm);
    verify.update(message);
    return verify.verify(cert, sig);
  } catch (ignored) {}
  return false;
}

export function verifyCertSign(cert: string, secret: string, sign: string) {
  const verify = crypto.createVerify(algorithm);
  verify.update(secret);
  return verify.verify(cert, Buffer.from(sign, "hex"));
}

export function generateKey() {
  return ecdh.generateKeys();
}

export function generateSecret(key: string) {
  return ecdh.computeSecret(Buffer.from(key, "hex"));
}

export function signSecret(secret: string) {
  const sign = crypto.createSign(algorithm);
  sign.update(secret);
  return sign.sign(normalizeKey(data.home.key));
}

export async function encrypt(secret: Buffer, text: string) {
  const iv = crypto.randomBytes(16);
  const s = await scrypt(secret);
  const cipher = crypto.createCipheriv(cipherAlgorithm, s, iv);
  return [cipher.update(text, "utf8", "hex") + cipher.final("hex"), iv];
}

export async function decrypt(secret: Buffer, encrypted: string, iv: string) {
  const s = await scrypt(secret);
  const decipher = crypto.createDecipheriv(
    cipherAlgorithm,
    s,
    Buffer.from(iv, "hex")
  );
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
}
