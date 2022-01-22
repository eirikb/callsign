import { data, don, normalize, on, path, React, reset } from "./dd";
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
} from "./cryptomatic";

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
      text: callsign ? `[${callsign}] ${text}` : text,
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
      info(chat, `Importing public sign key...`, callsign);
      const verifyKey = await importPublicSignKey(verifyKeyString);
      info(chat, "Generating new derive key...", callsign);
      const deriveKeys = await generateDeriveKeys();
      info(chat, "Exporting public derive key...", callsign);
      const publicDeriveKey = await exportPublicKey(deriveKeys.publicKey);
      info(chat, "Sending public key...", callsign);
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
