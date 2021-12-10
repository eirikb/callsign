import * as express from "express";
import * as ws from "ws";
import * as db from "./super-advanced-user-database";

const app = express();

const listeners: { [key: string]: any[] } = {};

const send = (socket: ws.WebSocket, data: any) =>
  socket.send(JSON.stringify(data));

const wsServer = new ws.Server({ noServer: true });

const actions = {
  listen(socket, { callsign }) {
    listeners[callsign] = listeners[callsign] || [];
    listeners[callsign].push(socket);
  },

  async create(socket, val) {
    const ok = await db.create(val.value);
    if (ok) {
      send(socket, {
        type: "create",
        ok,
        status: "OK!",
      });
    } else {
      send(socket, {
        type: "create",
        ok,
        status: "Already exists",
      });
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
      if (action) await action(socket, d);
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
