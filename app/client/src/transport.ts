import { data, on, path } from "./dd";

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

function connect() {
  ws = new WebSocket(
    `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}/api`
  );
  ws.addEventListener("open", () => {
    data.connected = true;
  });
  ws.addEventListener("message", (m) => {
    const val = JSON.parse(m.data);

    if (val.type === "create") {
      data.create.status = val.status;
      data.create.ok = val.ok !== false;
      return;
    } else if (val.type === "get") {
      if (val.ok) {
        console.log("OK!", val);
      } else {
        data.create.status = val.status;
        data.create.ok = val.ok;
      }
      return;
    }

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
    console.log("reconnect");
    setTimeout(connect, 1000);
  });
  ws.addEventListener("error", (err) => {
    console.error(err);
    ws?.close();
  });
}

connect();
