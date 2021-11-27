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

// export async function verifyCallsign(logger: Logger) {
//   logger.info(`Verifying callsign ${data.callsign}...`);
//   const crt = await fetch(
//     ` https://${data.callsign}/${data.callsign}.crt`
//   ).then((res) => res.text());
//   logger.info("Got cert");
//
//   const message = "Hello, world!";
//   const sign = crypto.createSign(algorithm);
//   sign.update(message);
//   const sig = sign.sign(data.key);
//   logger.info(`Signed ${hex(sig)}`);
//
//   const verify = crypto.createVerify(algorithm);
//   verify.update(message);
//   data.verified = verify.verify(crt, sig);
//   if (data.verified) {
//     logger.success(`Verified: ${data.verified}`);
//   } else {
//     logger.error(`Verified: ${data.verified}`);
//   }
// }
//
// export async function connectToCallsign(logger: Logger, callsign: string) {
//   logger.info(`Connecting to ${callsign}...`);
//   const key = ecdh.generateKeys();
//   keys[callsign] = key;
//   logger.info(`Created key ${hex(key)}`);
//
//   logger.info(`> Sending key...`);
//   data.outgoing = undefined;
//   data.outgoing = {
//     type: "key",
//     toCallsign: callsign,
//     fromCallsign: data.callsign,
//     key: key.toString("hex"),
//   } as MsgKey;
// }
//
// export async function send(logger: Logger, callsign: string, text: string) {
//   if (secrets[callsign]) {
//     logger.info(`Encrypting message ${text}`);
//
//     const iv = crypto.randomBytes(16);
//     const secret = await scrypt(secrets[callsign]);
//     const cipher = crypto.createCipheriv(cipherAlgorithm, secret, iv);
//     const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
//     logger.info(`Encrypted ${hex(encrypted)}, iv ${hex(iv)}`);
//
//     logger.info(`> Sending message...`);
//     data.outgoing = undefined;
//     data.outgoing = {
//       type: "msg",
//       toCallsign: callsign,
//       fromCallsign: data.callsign,
//       text: encrypted,
//       iv: iv.toString("hex"),
//     } as MsgMsg;
//   } else {
//     logger.warning(`Missing secret, please connect first`);
//   }
// }
//
// export async function onKey(logger: Logger, { toCallsign, key }: MsgKey) {
//   logger.info(`< Got key ${hex(key)}`);
//
//   const myKey = ecdh.generateKeys();
//   keys[toCallsign] = myKey;
//   logger.info(`Created key ${hex(myKey)}`);
//
//   const secret = ecdh.computeSecret(Buffer.from(key, "hex"));
//   pendingSecrets[toCallsign] = secret;
//   logger.info(`Created secret ${hex(secret)}`);
//
//   logger.info(`Signing secret...`);
//   const sign = crypto.createSign(algorithm);
//   sign.update(secret);
//   const sig = sign.sign(data.key);
//   logger.info(`Secret signed ${hex(sig)}`);
//
//   logger.info(`> Sending key + sign...`);
//   data.outgoing = undefined;
//   data.outgoing = {
//     type: "key2",
//     toCallsign,
//     fromCallsign: data.callsign,
//     key: myKey.toString("hex"),
//     sign: sig.toString("hex"),
//   } as MsgKey2;
// }
//
// export async function onKey2(
//   logger: Logger,
//   { toCallsign, key, sign }: MsgKey2
// ) {
//   logger.info(`< Got key ${hex(key)} with sign ${hex(sign)}`);
//
//   const myKey = keys[toCallsign];
//
//   logger.info(`Loaded my key ${hex(myKey)}`);
//
//   const secret = ecdh.computeSecret(Buffer.from(key, "hex"));
//   pendingSecrets[toCallsign] = secret;
//   logger.info(`Created secret ${hex(secret)}`);
//
//   logger.info(`Loading cert for...`);
//   const crt = await fetch(` https://${toCallsign}/${toCallsign}.crt`).then(
//     (res) => res.text()
//   );
//   logger.info("Got cert");
//   logger.info(`Verifying sign...`);
//   const verify = crypto.createVerify(algorithm);
//   verify.update(secret);
//   if (verify.verify(crt, Buffer.from(sign, "hex"))) {
//     logger.success(`Verified!`);
//     secrets[toCallsign] = pendingSecrets[toCallsign];
//     data.callsigns.push(toCallsign);
//
//     const sign = crypto.createSign(algorithm);
//     sign.update(secret);
//     const sig = sign.sign(data.key);
//     logger.info(`Secret signed ${hex(sig)}`);
//
//     logger.info(`> Sending sign...`);
//     data.outgoing = undefined;
//     data.outgoing = {
//       type: "key3",
//       toCallsign,
//       fromCallsign: data.callsign,
//       sign: sig.toString("hex"),
//     } as MsgKey3;
//   } else {
//     logger.error("Unable to verify :(");
//   }
// }
//
// export async function onKey3(logger: Logger, { toCallsign, sign }: MsgKey3) {
//   logger.info(`< Got sign ${hex(sign)}`);
//
//   logger.info(`Loading cert for...`);
//   const crt = await fetch(` https://${toCallsign}/${toCallsign}.crt`).then(
//     (res) => res.text()
//   );
//   logger.info("Got cert");
//   logger.info(`Verifying sign...`);
//   const verify = crypto.createVerify(algorithm);
//   verify.update(pendingSecrets[toCallsign]);
//   if (verify.verify(crt, Buffer.from(sign, "hex"))) {
//     logger.success(`Verified!`);
//     secrets[toCallsign] = pendingSecrets[toCallsign];
//     data.callsigns.push(toCallsign);
//   } else {
//     logger.error("Unable to verify :(");
//   }
// }
//
// export async function onMessage(
//   logger: Logger,
//   { toCallsign, text, iv }: MsgMsg
// ) {
//   logger.info(`< Got encrypted message ${hex(text)}, iv ${hex(iv)}`);
//
//   if (secrets[toCallsign]) {
//     logger.info("Decrypting...");
//     const secret = await scrypt(secrets[toCallsign]);
//     const decipher = crypto.createDecipheriv(
//       cipherAlgorithm,
//       secret,
//       Buffer.from(iv, "hex")
//     );
//     const decrypted =
//       decipher.update(text, "hex", "utf8") + decipher.final("utf8");
//     logger.important(decrypted);
//   } else {
//     logger.error("No valid session, please connect first");
//   }
// }
