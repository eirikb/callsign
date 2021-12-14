import * as express from "express";
import * as ws from "ws";
import * as db from "./super-advanced-user-database";
import { RegisterUserQuery, RegisterUserReply } from "./types";

const app = express();

const listeners: { [key: string]: any[] } = {};

const send = (socket: ws.WebSocket, data: any) =>
  socket.send(JSON.stringify(data));

const wsServer = new ws.Server({ noServer: true });

declare global {
  interface WebSocket {
    reply<T>(data: T): void;
  }
}

const actions = {
  listen(socket, { callsign }) {
    listeners[callsign] = listeners[callsign] || [];
    listeners[callsign].push(socket);
  },

  async registerUser(socket: WebSocket, val: RegisterUserQuery) {
    console.log("va", val);
    const ok = await db.create({
      callsign: val.callsign,
      password: val.password,
      email: "",
    });
    if (ok) {
      socket.reply<RegisterUserReply>({ status: "created" });
    } else {
      socket.reply<RegisterUserReply>({ status: "alreadyExists" });
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
        (socket as any).reply = (data: any) =>
          send(socket, Object.assign({ type: "reply" }, data));
        await action(socket, d);
      } else {
        console.log("Unknown action", action, d);
      }
    } catch (e) {
      send(socket, { status: "exception", error: e.message, type: "reply" });
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
