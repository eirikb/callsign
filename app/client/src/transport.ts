// setTimeout because

import { data, on, path } from "./dd";
import { queryTypes } from "../../server/types";

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
      fromCallsign: data.home.callsign,
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

on("+!*", path().panel, (p) => {
  if (p === "chat") {
    send({ fromCallsign: data.home.callsign, type: "listen" });
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
    data.connected = true;
  });
  ws.addEventListener("message", (m) => {
    const val = JSON.parse(m.data);
    console.log(">", val);

    if (val.type === "reply") {
      if (resolveHack && rejectHack) {
        if (val.error) rejectHack(val);
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
    console.log("reconnect");
    setTimeout(connect, 1000);
  });
  ws.addEventListener("error", (err) => {
    console.error(err);
    ws?.close();
  });
}

connect();
