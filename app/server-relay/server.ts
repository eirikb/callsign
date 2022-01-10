import * as ws from "ws";
import { WebSocket } from "ws";

const listeners: { [key: string]: any[] } = {};

const send = (socket: ws.WebSocket, data: any) =>
  socket.send(JSON.stringify(data));

const wsServer = new ws.Server({ port: 3001 }, () => {
  console.log("Relay ready");
});

const actions: { [key: string]: any } = {
  listen({ callsign }: { callsign: string }, socket: WebSocket) {
    listeners[callsign] = listeners[callsign] || [];
    listeners[callsign]?.push(socket);
  },

  async msg(val: any, socket: WebSocket) {
    const to = listeners[val.toCallsign];
    if (to) {
      for (const t of to) {
        t.send(JSON.stringify(val.value));
      }
    } else {
      send(socket, {
        type: "msgInfo",
        status: "notOnline",
        toCallsign: val.toCallsign,
      });
    }
  },
};

wsServer.on("connection", (socket) => {
  console.log("connection!");

  socket.on("message", async (message: any) => {
    const d = JSON.parse(message);
    console.log(d);
    const action: any = actions[d.type];
    try {
      if (action) {
        const res = await action(d, socket);
        if (res) {
          send(socket, Object.assign({ type: "reply" }, res));
        }
      } else {
        console.log("Unknown action", action, d);
        send(socket, {
          error: `Unknown action ${d.type}`,
          type: "reply",
        });
      }
    } catch (e) {
      send(socket, { error: e.message, type: "reply" });
    }
  });
});
