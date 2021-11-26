import { data, on, path } from "./dd";
import { fetchCert, generateKey, verifyCert } from "./e2ee";

// TODO: RE MOVE ME
on("!+*", path().panel, (m) => {
  console.log(m, data.home.callsign);
  if (data.home.callsign === "eirikb.callsign.network") {
    data.chat.sessions.push({
      callsign: "test.callsign.network",
      visible: true,
      direction: "outgoing",
      lines: [],
      outgoing: undefined,
      incoming: undefined,
    });
  }
});

const keys: { [callsign: string]: string } = {};

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
    key: key,
  };
}

on("+", path().chat.sessions.$, async (session: Session) => {
  console.log("+", session.visible, session.callsign);

  info(session, `Direction: ${session.direction}`);
  if (session.direction === "outgoing") {
    await verifyCallsign(session);
  }
});
on("!+*", path().chat.sessions.$.incoming, (incoming, { $ }) => {
  const session = data.chat.sessions[$];
  if (!session) return;
  session.incoming = undefined;
  console.log("incoming", incoming, "session", session);
});
