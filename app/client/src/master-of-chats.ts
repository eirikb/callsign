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
import { error, info, log, success, warning } from "./log";

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

async function onKey1(
  loggable: Loggable,
  sessionId: string,
  incoming: MsgKey1
) {
  info(loggable, `Importing public derive key...`, sessionId);
  const publicDeriveKey = await importPublicDeriveKey(incoming.publicDeriveKey);
  info(loggable, `Generating new derive key...`, sessionId);
  const deriveKeys = await generateDeriveKeys();
  info(loggable, `Creating new secret...`, sessionId);
  const secret = await derive(publicDeriveKey, deriveKeys.privateKey);
  info(loggable, "Exporting secret...", sessionId);
  const exportedSecret = await exportSecretKey(secret);
  info(loggable, `Importing sign key...`, sessionId);
  const signKey = await importPrivateSignKey(data.home.key);
  info(loggable, `Signing secret...`, sessionId);
  const signed = await sign(signKey, exportedSecret);
  info(loggable, "Exporting public derive key...", sessionId);
  const myPublicDeriveKey = await exportPublicKey(deriveKeys.publicKey);

  info(loggable, "Sending public derive key + signed...", sessionId);
  pendingSecret[sessionId] = secret;
  await sendData<MsgKey2>(loggable, sessionId, {
    from: {
      sessionId: data.home.sessionId,
      callsign: data.home.callsign,
    },
    action: "key2",
    publicDeriveKey: myPublicDeriveKey,
    signed,
  });
}

async function onKey2(
  loggable: Loggable,
  sessionId: string,
  callsign: string,
  incoming: MsgKey2
) {
  info(loggable, `Importing public derive key...`, sessionId);
  const publicDeriveKey = await importPublicDeriveKey(incoming.publicDeriveKey);

  info(loggable, `Creating new secret...`, sessionId);
  const privateDeriveKey = privateDeriveKeys[callsign];
  const secret = await derive(publicDeriveKey, privateDeriveKey);
  info(loggable, "Exporting secret...", sessionId);
  const exportedSecret = await exportSecretKey(secret);
  const verifyKey = pendingVerifyKey[callsign];
  info(loggable, `Verifying signature with secret...`, sessionId);
  if (await verify(verifyKey, incoming.signed, exportedSecret)) {
    success(loggable, `Verified signature`, sessionId);
    info(loggable, `Importing sign key...`, sessionId);
    const signKey = await importPrivateSignKey(data.home.key);
    info(loggable, `Signing secret...`, sessionId);
    const signed = await sign(signKey, exportedSecret);
    info(loggable, `Sending signature...`, sessionId);
    await sendData<MsgKey3>(loggable, sessionId, {
      from: {
        sessionId: data.home.sessionId,
        callsign: data.home.callsign,
      },
      action: "key3",
      signed,
    });
    success(loggable, `Ready`, callsign);
    loggable.lines.push({
      text: "Secure channel established!",
      type: "success",
    });
    return secret;
  } else {
    error(loggable, `Signature verification failed`, sessionId);
  }
}

async function onKey3(
  loggable: Loggable,
  sessionId: string,
  callsign: string,
  incoming: MsgKey3
) {
  info(loggable, `Importing public verify key...`, sessionId);
  const verifyKeyString = await fetchKey(callsign);
  info(loggable, `Importing public verify key...`, sessionId);
  const verifyKey = await importPublicSignKey(verifyKeyString);
  const secret = pendingSecret[sessionId];
  info(loggable, `Exporting secret key...`, sessionId);
  const exportedSecret = await exportSecretKey(secret);
  if (await verify(verifyKey, incoming.signed, exportedSecret)) {
    success(loggable, `Verified signature`, sessionId);
    loggable.lines.push({
      text: "Secure channel established!",
      type: "success",
    });
    return secret;
  } else {
    error(loggable, `Signature verification failed`, sessionId);
  }
}

export async function onSelfMessage(
  callsign: string,
  sessionId: string,
  incomingRaw: any
) {
  if (!incomingRaw) return;
  const chat = data.chat;
  const action = incomingRaw.action;
  console.log("action", action);
  if (action === "key1") {
    info(chat, `SYNC!`, sessionId);
    await onKey1(chat, sessionId, incomingRaw);
  } else if (action === "key2") {
    const secret = await onKey2(chat, sessionId, callsign, incomingRaw);
    console.log("SECRET?!", secret);
    if (secret) {
    }
  } else if (action === "key3") {
    const secret = await onKey3(chat, sessionId, callsign, incomingRaw);
    if (secret) {
      console.log("SECRET FROM 3", secret);
    }
  }
}

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
    info(session, `New incoming session`, sessionId);
    await onKey1(session, sessionId, incomingRaw);
  } else if (action === "key2") {
    const secret = await onKey2(session, sessionId, callsign, incomingRaw);
    if (secret) {
      session.sessionIds[normalize(sessionId)] = {
        sessionId,
        key: secret,
      };
      if (data.chat.selectedSession === "") {
        data.chat.selectedSession = session.callsign;
      }
    }
  } else if (action === "key3") {
    const secret = await onKey3(session, sessionId, callsign, incomingRaw);
    if (secret) {
      session.sessionIds[normalize(sessionId)] = {
        sessionId,
        key: secret,
      };
      session.active = data.chat.selectedSession !== session.callsign;
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

on("!+*", path().verified, (verified) => {
  if (verified) {
    // Ensure listeners are called and ready
    setTimeout(async () => {
      // console.log("send to", data.home.callsign);
      // send("p", data.home.callsign, {
      //   from: {
      //     sessionId: data.home.sessionId,
      //     callsign: data.home.callsign,
      //   },
      //   action: "sync",
      // });
      const chat = data.chat;
      const callsign = data.home.callsign;
      info(chat, `Preparing devices sync`, callsign);
      try {
        const verifyKeyString = await fetchKey(callsign);
        if (verifyKeyString) {
          info(chat, `Importing public verify key...`, callsign);
          pendingVerifyKey[callsign] = await importPublicSignKey(
            verifyKeyString
          );
          info(chat, "Generating new derive key...", callsign);
          const deriveKeys = await generateDeriveKeys();
          info(chat, "Exporting public derive key...", callsign);
          const publicDeriveKey = await exportPublicKey(deriveKeys.publicKey);
          info(chat, "Sending public derive key...", callsign);
          if (deriveKeys.privateKey) {
            privateDeriveKeys[callsign] = deriveKeys.privateKey;
          }
          await sendData<MsgKey1>(chat, callsign, {
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
    }, 3000);
  }
});

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
