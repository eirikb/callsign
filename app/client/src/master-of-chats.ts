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

const log = (logLevel: LogLevel, loggable: Loggable, text: string) =>
  loggable.lines.push({
    text,
    type: logLevel,
  });

const info = (loggable: Loggable, text: string) => log("info", loggable, text);
const success = (loggable: Loggable, text: string) =>
  log("success", loggable, text);
const warning = (loggable: Loggable, text: string) =>
  log("warning", loggable, text);
const error = (loggable: Loggable, text: string) =>
  log("error", loggable, text);

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
  // const session = data.chat.sessions[$];
  const action = incomingRaw.action;
  if (action === "key1") {
    info(data.chat, `Incoming session.`);
    const incoming = incomingRaw as MsgKey1;
    info(session, `Importing public derive key...`);
    const publicDeriveKey = await importPublicDeriveKey(
      incoming.publicDeriveKey
    );
    info(session, `Generating new derive key...`);
    const deriveKeys = await generateDeriveKeys();
    info(session, `Creating new secret...`);
    const secret = await derive(publicDeriveKey, deriveKeys.privateKey);
    info(session, "Exporting secret...");
    const exportedSecret = await exportSecretKey(secret);
    info(session, `Importing sign key...`);
    const signKey = await importPrivateSignKey(data.home.key);
    info(session, `Signing secret...`);
    const signed = await sign(signKey, exportedSecret);
    info(session, "Exporting public derive key...");
    const myPublicDeriveKey = await exportPublicKey(deriveKeys.publicKey);

    info(session, "Sending public derive key + signed...");
    await sendData<MsgKey2>(session, {
      action: "key2",
      publicDeriveKey: myPublicDeriveKey,
      signed,
    });
  } else if (action === "key2") {
    const incoming = incomingRaw as MsgKey2;
    console.log(JSON.stringify(session));
    // Huh
    setTimeout(() => {
      info(session, `Importing public derive key...`);
    }, 100);
    // const publicDeriveKey = await importPublicDeriveKey(
    //   incoming.publicDeriveKey
    // );
  }
});

on("+", path().chat.sessions.$, async (session: Session) => {
  console.log(session.incoming?.action);
  // await sendData(session, { action: "ok" });
  if (session.direction === "incoming") {
    return;
  }

  info(
    session,
    `New session. Fetching key from https://${session.callsign}/${session.callsign}.key ...`
  );
  try {
    const verifyKeyString = await fetchKey(session.callsign);
    if (verifyKeyString) {
      info(session, `Importing public sign key...`);
      const verifyKey = await importPublicSignKey(verifyKeyString);
      info(session, "Generating new derive key...");
      const deriveKeys = await generateDeriveKeys();
      info(session, "Exporting public derive key...");
      const publicDeriveKey = await exportPublicKey(deriveKeys.publicKey);
      info(session, "Sending public key...");
      await sendData<MsgKey1>(session, {
        action: "key1",
        publicDeriveKey,
      });
    } else {
      warning(session, "Key failed");
    }
  } catch (e) {
    error(session, `${e}`);
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
