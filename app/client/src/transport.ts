import { data, normalize } from "./dd";
import { queryTypes } from "../../server-relay/types";
import { getRandomString } from "./cryptomatic";
import { onMessage, onSelfMessage } from "./master-of-chats";

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
  loggable: Loggable,
  topic: string,
  data: any
) {
  try {
    send("p", topic, data);
  } catch (e) {
    console.error(e);
    loggable.lines.push({
      text: "Fail: " + e,
      type: "error",
    });
  }
}

let plugging = false;

export function listen() {
  if (plugging) {
    console.log("PLuggging...");
    return;
  }
  if (data.plugged) {
    console.log("already plugged");
    return;
  }
  if (data.home.callsign) {
    data.plugged = true;
    const id = getRandomString(12);

    data.chat.lines.push({
      type: "info",
      text: `Callsign ${data.home.callsign}`,
    });

    send("s", data.home.callsign);
    plugging = true;
  }
}

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
    // listen();
    data.connected = true;
  });
  // @ts-ignore
  ws.addEventListener("message", async (m) => {
    const val = JSON.parse(m.data);
    console.log(">", val);

    if (val.a === "plugged") {
      data.plugged = true;
      data.home.info = "Plugged in";
      plugging = false;
      setTimeout(() => {
        data.panel = "chat";
      }, 500);
      return;
    }

    if (!val.from?.callsign) {
      console.error("No fromCallsign", val);
      return;
    }

    if (val.from.callsign === data.home.callsign) {
      onSelfMessage(val.from.callsign, val.from.sessionId, val);
      return;
    }

    let session = data.chat.sessions[normalize(val.from.callsign)];
    if (!session) {
      session = {
        callsign: val.from.callsign,
        active: false,
        lines: [],
        direction: "incoming",
        sessionIds: {},
      };
      data.chat.sessions[normalize(val.from.callsign)] = session;
    }
    onMessage(val.from.sessionId, session, val);
  });

  ws.addEventListener("close", () => {
    data.connected = false;
    data.plugged = false;
    plugging = false;
    console.log("reconnect");
    setTimeout(connect, 1000);
  });
  ws.addEventListener("error", (err) => {
    console.error(err);
    ws?.close();
  });
}

connect();
