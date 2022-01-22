import { data, normalize, on, path } from "./dd";
import { queryTypes } from "../../server-relay/types";

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
      value: { ...outgoing, fromCallsign: data.home.callsign },
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

export async function query<T, R>(type: queryTypes, data: T): Promise<R> {
  return fetch(`/demo/${type}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  }).then((r) => r.json()) as unknown as R;
}

function connect() {
  ws = new WebSocket(
    `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}/relay`
  );
  ws.addEventListener("open", () => {
    console.log("Connected");
    listen();
    data.connected = true;
  });
  ws.addEventListener("message", async (m) => {
    const val = JSON.parse(m.data);
    console.log(">", val);

    if (!val.fromCallsign) {
      console.error("No fromCallsign", val);
      return;
    }

    const session = data.chat.sessions[normalize(val.fromCallsign)];
    if (session) {
      session.incoming = val;
    } else {
      data.chat.sessions[normalize(val.fromCallsign)] = {
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
