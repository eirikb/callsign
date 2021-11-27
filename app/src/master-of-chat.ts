import { data, on, path } from "./dd";
import {
  fetchCert,
  generateKey,
  generateSecret,
  normalize,
  signSecret,
  verifyCertSign,
} from "./e2ee";

// TODO: RE MOVE ME
on("!+*", path().panel, (m) => {
  console.log(m, data.home.callsign);
  if (data.home.callsign === "eirikb.callsign.network") {
    const callsign = "test.callsign.network";
    setTimeout(() => {
      data.chat.sessions[normalize(callsign)] = {
        callsign,
        direction: "outgoing",
        lines: [],
        outgoing: undefined,
        incoming: undefined,
      };
      data.chat.selectedSession = callsign;
    });
  }
});

const keys: { [callsign: string]: string } = {};
const pendingSecrets: { [callsign: string]: string } = {};
const secrets: { [callsign: string]: string } = {};

function hex(data: Buffer | string) {
  const s = typeof data === "string" ? data : data.toString("hex");
  return s.slice(0, 5).concat("...").concat(s.slice(-5));
}

function log(logLevel: LogLevel, session: Session, text: string) {
  session.lines.push({
    text,
    type: logLevel,
  });
}

const info = (session: Session, text: string) => log("info", session, text);
const success = (session: Session, text: string) =>
  log("success", session, text);
const warn = (session: Session, text: string) => log("warning", session, text);
const error = (session: Session, text: string) => log("error", session, text);

async function verifyCallsign(session: Session) {
  const key = generateKey();
  info(session, `Sending key ${hex(key)}`);
  keys[session.callsign] = key;
  session.outgoing = undefined;
  session.outgoing = {
    fromCallsign: data.home.callsign,
    type: "key",
    key: key.toString("hex"),
  };
}

async function onKey(session: Session, msg: MsgKey) {
  info(session, `Got key ${hex(msg.key)}`);
  const myKey = generateKey();
  keys[msg.fromCallsign] = myKey;
  info(session, `Created key ${hex(myKey)}`);

  const secret = generateSecret(msg.key);
  pendingSecrets[msg.fromCallsign] = secret;
  info(session, `Created secret ${hex(secret)}`);

  info(session, `Signing secret...`);
  const sign = signSecret(secret);
  info(session, `Secret signed ${hex(sign)}`);

  info(session, `Sending key + sign...`);
  session.outgoing = undefined;
  session.outgoing = {
    type: "key2",
    fromCallsign: data.home.callsign,
    key: myKey.toString("hex"),
    sign: sign.toString("hex"),
  } as MsgKey2;
}

async function onKey2(session: Session, msg: MsgKey2) {
  info(session, `Got key ${hex(msg.key)} with sign ${hex(msg.sign)}`);

  const myKey = keys[msg.fromCallsign];

  info(session, `Loaded my key ${hex(myKey)}`);

  const secret = generateSecret(msg.key);
  pendingSecrets[msg.fromCallsign] = secret;
  info(session, `Created secret ${hex(secret)}`);

  info(session, `Loading cert for ${msg.fromCallsign}`);
  try {
    const cert = await fetchCert(msg.fromCallsign);
    info(session, "Got cert");
    info(session, `Verifying sign...`);

    const verified = verifyCertSign(cert, secret, msg.sign);
    if (verified) {
      secrets[msg.fromCallsign] = pendingSecrets[msg.fromCallsign];
      delete pendingSecrets[msg.fromCallsign];

      const sign = signSecret(secret);
      info(session, `Secret signed ${hex(sign)}`);

      info(session, `Sending sign...`);
      session.outgoing = undefined;
      session.outgoing = {
        type: "key3",
        fromCallsign: data.home.callsign,
        sign: sign.toString("hex"),
      } as MsgKey3;
      success(session, `Verified!`);
    } else {
      error(session, "Unable to verify :(");
    }
  } catch (e) {
    console.error(e);
    error(session, `Unable to fetch cert`);
    return;
  }
}

async function onKey3(session: Session, msg: MsgKey3) {
  info(session, `Got sign ${hex(msg.sign)}`);

  info(session, `Loading cert for ${msg.fromCallsign}`);
  try {
    const cert = await fetchCert(msg.fromCallsign);

    info(session, "Got cert");
    info(session, `Verifying sign...`);

    try {
      const verified = verifyCertSign(
        cert,
        pendingSecrets[msg.fromCallsign],
        msg.sign
      );
      if (verified) {
        success(session, `Verified!`);
        secrets[msg.fromCallsign] = pendingSecrets[msg.fromCallsign];
        delete pendingSecrets[msg.fromCallsign];
      } else {
        error(session, "Unable to verify :(");
      }
    } catch (e) {
      console.error(e);
      error(session, `Unable to verify cert`);
    }
  } catch (e) {
    console.error(e);
    error(session, `Unable to fetch cert`);
  }
}

on("+", path().chat.sessions.$, async (session: Session) => {
  console.log("+", session.callsign);

  info(session, `Direction: ${session.direction}`);
  if (session.direction === "outgoing") {
    await verifyCallsign(session);
  }
});
on("!+*", path().chat.sessions.$.incoming, async (incoming, { $ }) => {
  const session = data.chat.sessions[$];
  if (!session) return;
  console.log("incoming", incoming, "session", session);
  // Nothing to see here, carry on
  setTimeout(() => {
    if (incoming.type === "key") {
      onKey(session, incoming as MsgKey);
    } else if (incoming.type === "key2") {
      onKey2(session, incoming as MsgKey2);
    } else if (incoming.type === "key3") {
      onKey3(session, incoming as MsgKey3);
    }
  });
  session.incoming = undefined;
});
