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
import { sendData } from "./transport";
import { error, info, success, warning } from "./log";

const privateDeriveKeys: { [callsign: string]: CryptoKey } = {};
const pendingSecret: { [sessionId: string]: CryptoKey } = {};
const pendingVerifyKey: { [callsign: string]: CryptoKey } = {};

// TODO:
// setTimeout(() => {
//   if (data.home.callsign === "b.callsign.network") {
//     data.chat.sessions[normalize("a.callsign.network")] = {
//       active: false,
//       callsign: "a.callsign.network",
//       direction: "outgoing",
//       lines: [],
//       sessionIds: {},
//     };
//   }
// }, 2000);

export async function onMessage(
  sessionId: string,
  session: Session,
  incomingRaw: any
) {
  if (!incomingRaw) return;
  const callsign = session.callsign;
  const chat = data.chat;
  const action = incomingRaw.action;

  if (action === "key1") {
    info(chat, `New incoming session`, sessionId);
    const incoming = incomingRaw as MsgKey1;
    info(chat, `Importing public derive key...`, sessionId);
    const publicDeriveKey = await importPublicDeriveKey(
      incoming.publicDeriveKey
    );
    info(chat, `Generating new derive key...`, sessionId);
    const deriveKeys = await generateDeriveKeys();
    info(chat, `Creating new secret...`, sessionId);
    const secret = await derive(publicDeriveKey, deriveKeys.privateKey);
    info(chat, "Exporting secret...", sessionId);
    const exportedSecret = await exportSecretKey(secret);
    info(chat, `Importing sign key...`, sessionId);
    const signKey = await importPrivateSignKey(data.home.key);
    info(chat, `Signing secret...`, sessionId);
    const signed = await sign(signKey, exportedSecret);
    info(chat, "Exporting public derive key...", sessionId);
    const myPublicDeriveKey = await exportPublicKey(deriveKeys.publicKey);

    info(chat, "Sending public derive key + signed...", sessionId);
    pendingSecret[sessionId] = secret;
    await sendData<MsgKey2>(session, sessionId, {
      from: {
        sessionId: data.home.sessionId,
        callsign: data.home.callsign,
      },
      action: "key2",
      publicDeriveKey: myPublicDeriveKey,
      signed,
    });
  } else if (action === "key2") {
    const incoming = incomingRaw as MsgKey2;
    info(chat, `Importing public derive key...`, sessionId);
    const publicDeriveKey = await importPublicDeriveKey(
      incoming.publicDeriveKey
    );

    info(chat, `Creating new secret...`, sessionId);
    const privateDeriveKey = privateDeriveKeys[callsign];
    const secret = await derive(publicDeriveKey, privateDeriveKey);
    info(chat, "Exporting secret...", sessionId);
    const exportedSecret = await exportSecretKey(secret);
    const verifyKey = pendingVerifyKey[callsign];
    info(chat, `Verifying signature with secret...`, sessionId);
    if (await verify(verifyKey, incoming.signed, exportedSecret)) {
      success(chat, `Verified signature`, sessionId);
      info(chat, `Importing sign key...`, sessionId);
      const signKey = await importPrivateSignKey(data.home.key);
      info(chat, `Signing secret...`, sessionId);
      const signed = await sign(signKey, exportedSecret);
      info(chat, `Sending signature...`, sessionId);
      await sendData<MsgKey3>(session, sessionId, {
        from: {
          sessionId: data.home.sessionId,
          callsign: data.home.callsign,
        },
        action: "key3",
        signed,
      });
      session.sessionIds[normalize(sessionId)] = {
        sessionId,
        key: secret,
      };

      success(chat, `Ready`, callsign);
      session.lines.push({
        text: "Secure channel established!",
        type: "success",
      });
      if (data.chat.selectedSession === "") {
        data.chat.selectedSession = session.callsign;
      }
    } else {
      error(chat, `Signature verification failed`, sessionId);
    }
  } else if (action === "key3") {
    const incoming = incomingRaw as MsgKey3;
    info(chat, `Importing public verify key...`, sessionId);
    const verifyKeyString = await fetchKey(session.callsign);
    info(chat, `Importing public verify key...`, sessionId);
    const verifyKey = await importPublicSignKey(verifyKeyString);
    const secret = pendingSecret[sessionId];
    info(chat, `Exporting secret key...`, sessionId);
    const exportedSecret = await exportSecretKey(secret);
    if (await verify(verifyKey, incoming.signed, exportedSecret)) {
      success(chat, `Verified signature`, sessionId);
      session.sessionIds[normalize(incoming.from.sessionId)] = {
        sessionId,
        key: secret,
      };
      session.lines.push({
        text: "Secure channel established!",
        type: "success",
      });
      session.active = data.chat.selectedSession !== session.callsign;
    } else {
      error(chat, `Signature verification failed`, sessionId);
    }
  } else if (action === "message") {
    const incoming = incomingRaw as MsgMessage;
    const key = session.sessionIds[normalize(incoming.from.sessionId)].key;
    const decrypted = await decrypt(key, incoming.iv, incoming.cipher);
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
    warning(chat, `Unknown action: ${action}`, sessionId);
  }
}

on("+", path().chat.sessions.$, async (session: Session) => {
  if (session.direction === "incoming") {
    return;
  }

  const callsign = session.callsign;
  const chat = data.chat;
  info(chat, `New outgoing session`, callsign);
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
      await sendData<MsgKey1>(session, session.callsign, {
        from: {
          sessionId: data.home.sessionId,
          callsign: data.home.callsign,
        },
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
