import { data, normalize, on, path } from "./dd";
import {
  derive,
  exportPublicKey,
  exportSecretKey,
  fetchKey,
  generateDeriveKeys,
  importPrivateSignKey,
  importPublicDeriveKey,
  importPublicSignKey,
  sign,
  verify,
} from "./cryptomatic";

const privateDeriveKeys: { [callsign: string]: CryptoKey } = {};
const pendingSecret: { [callsign: string]: CryptoKey } = {};
const pendingVerifyKey: { [callsign: string]: CryptoKey } = {};

// TODO:
setTimeout(() => {
  if (data.home.callsign === "a.callsign.network") {
    data.chat.sessions[normalize("b.callsign.network")] = {
      callsign: "b.callsign.network",
      direction: "outgoing",
      incoming: undefined,
      key: undefined,
      lines: [],
      outgoing: undefined,
    };
  }
}, 2000);

const log = (
  logLevel: LogLevel,
  loggable: Loggable,
  text: string,
  callsign?: string
) =>
  // Huh
  setTimeout(() =>
    loggable.lines.push({
      text: callsign
        ? `[${new Date()
            .toISOString()
            .replace(/....Z/, "")
            .replace(/T/, " ")} ${callsign}] ${text}`
        : text,
      type: logLevel,
    })
  );

const info = (loggable: Loggable, text: string, callsign?: string) =>
  log("info", loggable, text, callsign);
const success = (loggable: Loggable, text: string, callsign?: string) =>
  log("success", loggable, text, callsign);
const warning = (loggable: Loggable, text: string, callsign?: string) =>
  log("warning", loggable, text, callsign);
const error = (loggable: Loggable, text: string, callsign?: string) =>
  log("error", loggable, text, callsign);

function currentSession() {
  return data.chat.sessions[normalize(data.chat.selectedSession)];
}

async function sendData<T>(session: Session, d: T) {
  if (session.key) {
    // const secret = await importSecretKey(session.key);
    // const [iv, cipher] = await secretEncrypt(secret, JSON.stringify(d));
    // d = { from: data.home.callsign, iv, cipher };
  }

  session.outgoing = undefined;
  session.outgoing = d;
}

on("!+*", path().chat.sessions.$.incoming, async (incomingRaw: any, { $ }) => {
  const session = data.chat.sessions[$];
  const callsign = session.callsign;
  const chat = data.chat;
  const action = incomingRaw.action;
  if (action === "key1") {
    info(chat, `New incoming session.`, callsign);
    const incoming = incomingRaw as MsgKey1;
    info(chat, `Importing public derive key...`, callsign);
    const publicDeriveKey = await importPublicDeriveKey(
      incoming.publicDeriveKey
    );
    info(chat, `Generating new derive key...`, callsign);
    const deriveKeys = await generateDeriveKeys();
    info(chat, `Creating new secret...`, callsign);
    const secret = await derive(publicDeriveKey, deriveKeys.privateKey);
    info(chat, "Exporting secret...", callsign);
    const exportedSecret = await exportSecretKey(secret);
    info(chat, `Importing sign key...`, callsign);
    const signKey = await importPrivateSignKey(data.home.key);
    info(chat, `Signing secret...`, callsign);
    const signed = await sign(signKey, exportedSecret);
    info(chat, "Exporting public derive key...", callsign);
    const myPublicDeriveKey = await exportPublicKey(deriveKeys.publicKey);

    info(chat, "Sending public derive key + signed...", callsign);
    pendingSecret[session.callsign] = secret;
    await sendData<MsgKey2>(session, {
      action: "key2",
      publicDeriveKey: myPublicDeriveKey,
      signed,
    });
  } else if (action === "key2") {
    const incoming = incomingRaw as MsgKey2;
    info(chat, `Importing public derive key...`, callsign);
    const publicDeriveKey = await importPublicDeriveKey(
      incoming.publicDeriveKey
    );

    info(chat, `Creating new secret...`, callsign);
    const privateDeriveKey = privateDeriveKeys[callsign];
    const secret = await derive(publicDeriveKey, privateDeriveKey);
    info(chat, "Exporting secret...", callsign);
    const exportedSecret = await exportSecretKey(secret);
    const verifyKey = pendingVerifyKey[callsign];
    info(chat, `Verifying signature with secret...`, callsign);
    if (await verify(verifyKey, incoming.signed, exportedSecret)) {
      session.key = secret;
      success(chat, `Verified signature`, callsign);
      info(chat, `Importing sign key...`, callsign);
      const signKey = await importPrivateSignKey(data.home.key);
      info(chat, `Signing secret...`, callsign);
      const signed = await sign(signKey, exportedSecret);
      info(chat, `Sending signature...`, callsign);
      await sendData<MsgKey3>(session, {
        action: "key3",
        signed,
      });
      success(chat, `Ready`, callsign);
    } else {
      error(chat, `Signature verification failed`, callsign);
    }
  } else if (action === "key3") {
    const incoming = incomingRaw as MsgKey3;
    info(chat, `Importing public verify key...`, callsign);
    const verifyKeyString = await fetchKey(session.callsign);
    info(chat, `Importing public verify key...`, callsign);
    const verifyKey = await importPublicSignKey(verifyKeyString);
    const secret = pendingSecret[session.callsign];
    info(chat, `Exporting secret key...`, callsign);
    const exportedSecret = await exportSecretKey(secret);
    if (await verify(verifyKey, incoming.signed, exportedSecret)) {
      success(chat, `Verified signature`, callsign);
      session.key = secret;
    } else {
      error(chat, `Signature verification failed`, callsign);
    }
  } else {
    warning(chat, `Unknown action: ${action}`, callsign);
  }
});

on("+", path().chat.sessions.$, async (session: Session) => {
  console.log(session.incoming?.action);
  // await sendData(session, { action: "ok" });
  if (session.direction === "incoming") {
    return;
  }

  const callsign = session.callsign;
  const chat = data.chat;
  info(chat, `New outgoing session...`, callsign);
  try {
    const verifyKeyString = await fetchKey(session.callsign);
    if (verifyKeyString) {
      info(chat, `Importing public verify key...`, callsign);
      pendingVerifyKey[callsign] = await importPublicSignKey(verifyKeyString);
      info(chat, "Generating new derive key...", callsign);
      const deriveKeys = await generateDeriveKeys();
      info(chat, "Exporting public derive key...", callsign);
      const publicDeriveKey = await exportPublicKey(deriveKeys.publicKey);
      info(chat, "Sending public derive key...", callsign);
      if (deriveKeys.privateKey) {
        privateDeriveKeys[session.callsign] = deriveKeys.privateKey;
      }
      await sendData<MsgKey1>(session, {
        action: "key1",
        publicDeriveKey,
      });
    } else {
      warning(chat, "Key failed", callsign);
    }
  } catch (e) {
    error(chat, `${e}`, callsign);
  }
});

async function send(e: Event) {
  e.preventDefault();
  const text = data.chat.text;
  await sendData(currentSession(), { text });
  currentSession().lines.push({
    text,
    type: "from",
  });
  data.chat.text = "";
}
