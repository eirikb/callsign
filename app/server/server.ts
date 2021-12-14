import * as express from "express";
import * as ws from "ws";
import * as db from "./super-advanced-user-database";

const app = express();

const listeners: { [key: string]: any[] } = {};

const send = (socket: ws.WebSocket, data: any) =>
  socket.send(JSON.stringify(data));

const sendStatus = (
  socket: ws.WebSocket,
  path: string,
  status: string,
  ok: boolean
) => send(socket, { type: "status", path, status, ok });

const wsServer = new ws.Server({ noServer: true });

const actions = {
  listen(socket, { callsign }) {
    listeners[callsign] = listeners[callsign] || [];
    listeners[callsign].push(socket);
  },

  async registerUser(socket, val) {
    const ok = await db.create(val.value);
    if (ok) {
      socket.ok("OK!");
    } else {
      socket.fail("Already exists");
    }
  },

  async get(socket, val) {
    const { callsign, password } = val.value;
    const ok = await db.verify(callsign, password);
    if (ok) {
      send(socket, {
        type: "get",
        ok,
      });
    } else {
      send(socket, {
        type: "get",
        ok,
        status: "Wrong password",
      });
    }
  },

  msg(socket, val) {
    const to = listeners[val.toCallsign];
    if (to) {
      for (const t of to) {
        console.log("to", t);
        t.send(JSON.stringify(val.value));
      }
    }
  },
};

wsServer.on("connection", (socket) => {
  console.log("connection!");
  socket.on("message", async (message: any) => {
    const d = JSON.parse(message);
    console.log(d);
    const action = actions[d.type];
    try {
      if (action) {
        (socket as any).ok = (text: string) =>
          sendStatus(socket, d.type, text, true);
        (socket as any).fail = (text: string) =>
          sendStatus(socket, d.type, text, false);
        await action(socket, d, d.type);
      }
    } catch (e) {
      send(socket, { ok: false, status: e.message, type: d.type });
    }
  });
});

const server = app.listen(3000, () => {
  console.log("ready");
});

server.on("upgrade", (request, socket: any, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});
