import { data } from "./dd";
// @ts-ignore
import crypto from "crypto";
import { scrypt as scryptJs } from "scrypt-js";
import { sendMessage } from "./transport";
import { hex } from "./log";

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

export async function verifyCallsign(logger: Logger) {
  logger.info(`Verifying callsign ${data.callsign}...`);
  const crt = await fetch(
    ` https://${data.callsign}/${data.callsign}.crt`
  ).then((res) => res.text());
  logger.info("Got cert");

  const message = "Hello, world!";
  const sign = crypto.createSign(algorithm);
  sign.update(message);
  const sig = sign.sign(data.key);
  logger.info(`Signed ${hex(sig)}`);

  const verify = crypto.createVerify(algorithm);
  verify.update(message);
  data.verified = verify.verify(crt, sig);
  if (data.verified) {
    logger.success(`Verified: ${data.verified}`);
  } else {
    logger.error(`Verified: ${data.verified}`);
  }
}

export async function connectToCallsign(logger: Logger, callsign: string) {
  logger.info(`Connecting to ${callsign}...`);
  const key = ecdh.generateKeys();
  keys[callsign] = key;
  logger.info(`Created key ${hex(key)}`);

  logger.info(`> Sending key...`);
  await sendMessage<MsgKey>(callsign, "key", {
    key: key.toString("hex"),
    callsign: data.callsign,
  });
}

export async function send(logger: Logger, callsign: string, text: string) {
  if (secrets[callsign]) {
    logger.info(`Encrypting message ${text}`);

    const iv = crypto.randomBytes(16);
    const secret = await scrypt(secrets[callsign]);
    const cipher = crypto.createCipheriv(cipherAlgorithm, secret, iv);
    const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");
    logger.info(`Encrypted ${hex(encrypted)}, iv ${hex(iv)}`);

    logger.info(`> Sending message...`);
    await sendMessage<MsgMsg>(callsign, "msg", {
      callsign: data.callsign,
      text: encrypted,
      iv: iv.toString("hex"),
    });
  } else {
    logger.warning(`Missing secret, please connect first`);
  }
}

export async function onKey(logger: Logger, { callsign, key }: MsgKey) {
  logger.info(`< Got key ${hex(key)}`);

  const myKey = ecdh.generateKeys();
  keys[callsign] = myKey;
  logger.info(`Created key ${hex(myKey)}`);

  const secret = ecdh.computeSecret(Buffer.from(key, "hex"));
  pendingSecrets[callsign] = secret;
  logger.info(`Created secret ${hex(secret)}`);

  logger.info(`Signing secret...`);
  const sign = crypto.createSign(algorithm);
  sign.update(secret);
  const sig = sign.sign(data.key);
  logger.info(`Secret signed ${hex(sig)}`);

  logger.info(`> Sending key + sign...`);
  await sendMessage<MsgKey2>(callsign, "key2", {
    callsign: data.callsign,
    key: myKey.toString("hex"),
    sign: sig.toString("hex"),
  });
}

export async function onKey2(logger: Logger, { callsign, key, sign }: MsgKey2) {
  logger.info(`< Got key ${hex(key)} with sign ${hex(sign)}`);

  const myKey = keys[callsign];

  logger.info(`Loaded my key ${hex(myKey)}`);

  const secret = ecdh.computeSecret(Buffer.from(key, "hex"));
  pendingSecrets[callsign] = secret;
  logger.info(`Created secret ${hex(secret)}`);

  logger.info(`Loading cert for...`);
  const crt = await fetch(` https://${callsign}/${callsign}.crt`).then((res) =>
    res.text()
  );
  logger.info("Got cert");
  logger.info(`Verifying sign...`);
  const verify = crypto.createVerify(algorithm);
  verify.update(secret);
  if (verify.verify(crt, Buffer.from(sign, "hex"))) {
    logger.success(`Verified!`);
    secrets[callsign] = pendingSecrets[callsign];
    data.callsigns.push(callsign);

    const sign = crypto.createSign(algorithm);
    sign.update(secret);
    const sig = sign.sign(data.key);
    logger.info(`Secret signed ${hex(sig)}`);

    logger.info(`> Sending sign...`);
    await sendMessage<MsgKey3>(callsign, "key3", {
      sign: sig.toString("hex"),
      callsign: data.callsign,
    });
  } else {
    logger.error("Unable to verify :(");
  }
}

export async function onKey3(logger: Logger, { callsign, sign }: MsgKey3) {
  logger.info(`< Got sign ${hex(sign)}`);

  logger.info(`Loading cert for...`);
  const crt = await fetch(` https://${callsign}/${callsign}.crt`).then((res) =>
    res.text()
  );
  logger.info("Got cert");
  logger.info(`Verifying sign...`);
  const verify = crypto.createVerify(algorithm);
  verify.update(pendingSecrets[callsign]);
  if (verify.verify(crt, Buffer.from(sign, "hex"))) {
    logger.success(`Verified!`);
    secrets[callsign] = pendingSecrets[callsign];
    data.callsigns.push(callsign);
  } else {
    logger.error("Unable to verify :(");
  }
}

export async function onMessage(
  logger: Logger,
  { callsign, text, iv }: MsgMsg
) {
  logger.info(`< Got encrypted message ${hex(text)}, iv ${hex(iv)}`);

  if (secrets[callsign]) {
    logger.info("Decrypting...");
    const secret = await scrypt(secrets[callsign]);
    const decipher = crypto.createDecipheriv(
      cipherAlgorithm,
      secret,
      Buffer.from(iv, "hex")
    );
    const decrypted =
      decipher.update(text, "hex", "utf8") + decipher.final("utf8");
    logger.important(decrypted);
  } else {
    logger.error("No valid session, please connect first");
  }
}
