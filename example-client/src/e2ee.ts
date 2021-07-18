import { bold, error, hex, info, success, warning } from "./log";
import { data } from "./dd";
// @ts-ignore
import crypto from "crypto";
import { scrypt as scryptJs } from "scrypt-js";
import { sendMessage } from "./transport";

const algorithm = "sha512";
const cipherAlgorithm = "aes-256-cbc";
const ecdh = crypto.createECDH("secp521r1");

const pendingSecrets: { [callsign: string]: Buffer } = {};
const secrets: { [callsign: string]: Buffer } = {};
const keys: { [callsign: string]: Buffer } = {};

async function scrypt(password: Buffer): Promise<Buffer> {
  const N = 1024;
  const r = 8;
  const p = 1;
  const dkLen = 32;
  return scryptJs(password, Buffer.from(""), N, r, p, dkLen).then((res) =>
    Buffer.from(res)
  );
}

export async function verifyCallsign() {
  info(`Verifying callsign ${data.callsign}...`);
  const crt = await fetch(
    ` https://${data.callsign}/${data.callsign}.crt`
  ).then((res) => res.text());
  info("Got cert");

  const message = "Hello, world!";
  const sign = crypto.createSign(algorithm);
  sign.update(message);
  const sig = sign.sign(data.key);
  info(`Signed ${hex(sig)}`);

  const verify = crypto.createVerify(algorithm);
  verify.update(message);
  data.verified = verify.verify(crt, sig);
  if (data.verified) {
    success(`Verified: ${data.verified}`);
  } else {
    error(`Verified: ${data.verified}`);
  }
}

export async function connectToCallsign(callsign: string) {
  info(`Connecting to ${callsign}...`);
  try {
    const key = ecdh.generateKeys();
    keys[callsign] = key;
    info(`Created key ${hex(key)}`, callsign);

    info(`> Sending key...`, callsign);
    await sendMessage<MsgKey>(callsign, "key", {
      key: key.toString("hex"),
      callsign: data.callsign,
    });
  } catch (e) {
    error(`Failed: ${e}`, callsign);
  }
}

export async function send(callsign: string, text: string) {
  if (secrets[callsign]) {
    info(`Encrypting message ${text}`, callsign);

    const iv = crypto.randomBytes(16);
    const secret = await scrypt(secrets[callsign]);
    const cipher = crypto.createCipheriv(cipherAlgorithm, secret, iv);
    const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
    info(`Encrypted ${hex(encrypted)}, iv ${hex(iv)}`, callsign);

    info(`> Sending message...`, callsign);
    await sendMessage<MsgMsg>(callsign, "msg", {
      callsign: data.callsign,
      text: encrypted,
      iv: iv.toString("hex"),
    });
  } else {
    warning(`Missing secret, please connect first`, callsign);
  }
}

export async function onKey({ callsign, key }: MsgKey) {
  info(`< Got key ${hex(key)}`, callsign);

  const myKey = ecdh.generateKeys();
  keys[callsign] = myKey;
  info(`Created key ${hex(myKey)}`, callsign);

  const secret = ecdh.computeSecret(Buffer.from(key, "hex"));
  pendingSecrets[callsign] = secret;
  info(`Created secret ${hex(secret)}`, callsign);

  info(`Signing secret...`, callsign);
  const sign = crypto.createSign(algorithm);
  sign.update(secret);
  const sig = sign.sign(data.key);
  info(`Secret signed ${hex(sig)}`, callsign);

  info(`> Sending key + sign...`, callsign);
  await sendMessage<MsgKey2>(callsign, "key2", {
    callsign: data.callsign,
    key: myKey.toString("hex"),
    sign: sig.toString("hex"),
  });
}

export async function onKey2({ callsign, key, sign }: MsgKey2) {
  info(`< Got key ${hex(key)} with sign ${hex(sign)}`, callsign);

  const myKey = keys[callsign];

  info(`Loaded my key ${hex(myKey)}`, callsign);

  const secret = ecdh.computeSecret(Buffer.from(key, "hex"));
  pendingSecrets[callsign] = secret;
  info(`Created secret ${hex(secret)}`, callsign);

  info(`Loading cert for...`, callsign);
  const crt = await fetch(` https://${callsign}/${callsign}.crt`).then((res) =>
    res.text()
  );
  info("Got cert", callsign);
  info(`Verifying sign...`, callsign);
  const verify = crypto.createVerify(algorithm);
  verify.update(secret);
  if (verify.verify(crt, Buffer.from(sign, "hex"))) {
    success(`Verified!`, callsign);
    secrets[callsign] = pendingSecrets[callsign];
    data.callsigns.push(callsign);

    const sign = crypto.createSign(algorithm);
    sign.update(secret);
    const sig = sign.sign(data.key);
    info(`Secret signed ${hex(sig)}`, callsign);

    info(`> Sending sign...`, callsign);
    await sendMessage<MsgKey3>(callsign, "key3", {
      sign: sig.toString("hex"),
      callsign: data.callsign,
    });
  } else {
    error("Unable to verify :(", callsign);
  }
}

export async function onKey3({ callsign, sign }: MsgKey3) {
  info(`< Got sign ${hex(sign)}`, callsign);

  info(`Loading cert for...`, callsign);
  const crt = await fetch(` https://${callsign}/${callsign}.crt`).then((res) =>
    res.text()
  );
  info("Got cert", callsign);
  info(`Verifying sign...`, callsign);
  const verify = crypto.createVerify(algorithm);
  verify.update(pendingSecrets[callsign]);
  if (verify.verify(crt, Buffer.from(sign, "hex"))) {
    success(`Verified!`, callsign);
    secrets[callsign] = pendingSecrets[callsign];
    data.callsigns.push(callsign);
  } else {
    error("Unable to verify :(", callsign);
  }
}

export async function onMessage({ callsign, text, iv }: MsgMsg) {
  info(`< Got encrypted message ${hex(text)}, iv ${hex(iv)}`, callsign);

  if (secrets[callsign]) {
    info("Decrypting...", callsign);
    const secret = await scrypt(secrets[callsign]);
    const decipher = crypto.createDecipheriv(
      cipherAlgorithm,
      secret,
      Buffer.from(iv, "hex")
    );
    const decrypted =
      decipher.update(text, "hex", "utf8") + decipher.final("utf8");
    bold(decrypted, callsign);
  } else {
    error("No valid session, please connect first", callsign);
  }
}
