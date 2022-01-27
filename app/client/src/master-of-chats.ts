import { data, normalize, on, path } from "./dd";
import {
  decrypt,
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
// setTimeout(() => {
//   if (data.home.callsign === "a.callsign.network") {
//     data.chat.sessions[normalize("b.callsign.network")] = {
//       active: false,
//       callsign: "b.callsign.network",
//       direction: "outgoing",
//       incoming: undefined,
//       key: undefined,
//       lines: [],
//       outgoing: undefined,
//     };
//   }
// }, 2000);

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

export async function sendData<T>(session: Session, d: T) {
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
      session.key = secret;
      success(chat, `Ready`, callsign);
      session.lines.push({
        text: "Secure channel established!",
        type: "success",
      });
      if (data.chat.selectedSession === "") {
        data.chat.selectedSession = session.callsign;
      }
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
      session.lines.push({
        text: "Secure channel established!",
        type: "success",
      });
      session.active = data.chat.selectedSession !== session.callsign;
    } else {
      error(chat, `Signature verification failed`, callsign);
    }
  } else if (action === "message") {
    const incoming = incomingRaw as MsgMessage;
    const decrypted = await decrypt(session.key, incoming.iv, incoming.cipher);
    session.lines.push({
      text: decrypted,
      type: "to",
    });
    session.active =
      data.chat.selectedSession !== session.callsign || data.chat.menuOpen;
    if (document.hidden) {
      document.title = `Callsign - ${Date.now()}`;
    }
  } else {
    warning(chat, `Unknown action: ${action}`, callsign);
  }
});

on("+", path().chat.sessions.$, async (session: Session) => {
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
