import { data, normalize, on, path } from "./dd";
import { queryTypes } from "../../server-relay/types";
import { getRandomString } from "./cryptomatic";
import { onMessage } from "./master-of-chats";

let ws: WebSocket | undefined = undefined;

export function send(action: "p" | "s", topic: string, data: any = undefined) {
  ws?.send(
    JSON.stringify({
      a: action,
      t: topic,
      d: data,
    })
  );
}

export async function sendData<T extends Msg>(
  session: Session,
  topic: string,
  data: any
) {
  try {
    send("p", topic, data);
  } catch (e) {
    console.error(e);
    session.lines.push({
      text: "Fail: " + e,
      type: "error",
    });
  }
}

let listening = false;

function listen() {
  if (listening) return;
  if (data.home.callsign) {
    listening = true;
    const id = getRandomString(12);
    data.home.sessionId = data.home.callsign + "@" + id;

    data.chat.lines.push({
      type: "info",
      text: `Callsign ${data.home.callsign}`,
    });
    data.chat.lines.push({
      type: "info",
      text: `Session ${data.home.sessionId}`,
    });

    send("s", data.home.sessionId);
    send("s", data.home.callsign);
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

    if (!val.from?.callsign) {
      console.error("No fromCallsign", val);
      return;
    }

    let session = data.chat.sessions[normalize(val.from.callsign)];
    if (!session) {
      session = {
        callsign: val.from.callsign,
        active: false,
        lines: [],
        direction: "incoming",
        sessionIdKeys: {},
      };
      data.chat.sessions[normalize(val.from.callsign)] = session;
    }
    onMessage(val.from.sessionId, session, val);
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
