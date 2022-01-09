// setTimeout because

import { data, normalize, on, path } from "./dd";
import { queryTypes } from "../../server-relay/types";
import {
  decrypt,
  importPrivateKey,
  importSecretKey,
  secretDecrypt,
} from "./cryptomatic";

let ws: WebSocket | undefined = undefined;

export function send(v: any) {
  ws?.send(JSON.stringify(v));
}

on("!+*", path().chat.sessions.$.outgoing, async (outgoing, { $ }) => {
  const session = data.chat.sessions[$];
  try {
    send({
      type: "msg",
      toCallsign: session.callsign,
      value: outgoing,
    });
  } catch (e) {
    console.error(e);
    session.lines.push({
      text: "Fail: " + e,
      type: "error",
    });
  }
});

let listening = false;

function listen() {
  if (listening) return;
  if (data.home.callsign) {
    listening = true;
    send({ callsign: data.home.callsign, type: "listen" });
  }
}

on("+!*", path().panel, (p) => {
  if (p === "chat") {
    listen();
  }
});

// Imagine you haven't seen the next few lines, and continue with your life
let resolveHack: any;
let rejectHack: any;

export async function query<T, R>(type: queryTypes, data: T): Promise<R> {
  return new Promise((resolve, reject) => {
    resolveHack = resolve;
    rejectHack = reject;
    ws?.send(JSON.stringify(Object.assign({ type }, data)));
  });
}

function connect() {
  ws = new WebSocket(
    `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}/api`
  );
  ws.addEventListener("open", () => {
    listen();
    data.connected = true;
  });
  ws.addEventListener("message", async (m) => {
    const val = JSON.parse(m.data);
    console.log(">", val);

    if (val.encrypted) {
      const privateKey = await importPrivateKey(data.home.key);
      const decrypted = await decrypt(privateKey, val.encrypted);
      const d = JSON.parse(decrypted);
      if (d.from && d.secret) {
        const callsign = d.from;
        data.chat.sessions[normalize(callsign)] = {
          callsign,
          direction: "incoming",
          lines: [],
          outgoing: undefined,
          incoming: undefined,
          key: d.secret,
        };
      }
      return;
    }

    if (val.cipher) {
      const session = data.chat.sessions[normalize(val.from)];
      const secret = await importSecretKey(session.key);
      const decrypt = await secretDecrypt(secret, val.iv, val.cipher);
      const d = JSON.parse(decrypt);
      if (d.action) {
        session.lines.push({
          text: d.action,
          type: "info",
        });
      } else {
        session.lines.push({
          text: d.text,
          type: "to",
        });
      }
      return;
    }

    if (val.type === "reply") {
      if (resolveHack && rejectHack) {
        if (val.error) rejectHack(val.error);
        else resolveHack(val);
      }
      return;
    }

    if (!val.fromCallsign) {
      console.error("No fromCallsign", val);
      return;
    }

    const session = data.chat.sessions[val.fromCallsign];
    if (session) {
      session.incoming = val;
    } else {
      data.chat.sessions[val.fromCallsign] = {
        callsign: val.fromCallsign,
        lines: [],
        direction: "incoming",
        outgoing: undefined,
        incoming: val,
      };
    }
  });

  ws.addEventListener("close", () => {
    listening = false;
    console.log("reconnect");
    setTimeout(connect, 1000);
  });
  ws.addEventListener("error", (err) => {
    console.error(err);
    ws?.close();
  });
}

connect();
