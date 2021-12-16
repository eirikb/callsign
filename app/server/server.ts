import * as express from "express";
import * as ws from "ws";
import * as db from "./super-advanced-user-database";
import * as fs from "fs/promises";
import {
  RegisterUserQuery,
  RegisterUserReply,
  UploadKeyQuery,
  UploadKeyReply,
} from "./types";
import { WebSocket } from "ws";

const app = express();

const listeners: { [key: string]: any[] } = {};

const send = (socket: ws.WebSocket, data: any) =>
  socket.send(JSON.stringify(data));

const wsServer = new ws.Server({ noServer: true });

const actions: { [key: string]: any } = {
  listen({ callsign }: { callsign: string }, socket: WebSocket) {
    listeners[callsign] = listeners[callsign] || [];
    listeners[callsign]?.push(socket);
  },

  async registerUser(val: RegisterUserQuery): Promise<RegisterUserReply> {
    console.log("va", val);
    const ok = await db.create({
      callsign: val.callsign,
      password: val.password,
      email: "",
    });
    if (ok) {
      return { status: "created" };
    } else {
      return { status: "alreadyExists" };
    }
  },

  async uploadKey(val: UploadKeyQuery): Promise<UploadKeyReply> {
    console.log("KEY!", val);
    if (await db.verify(val.callsign, val.password)) {
      const callsign = `${val.callsign}.callsign.network`;
      const dir = `./data/keys/${callsign}`;
      await fs.mkdir(dir, { recursive: true });
      const keyPath = `${dir}/${callsign}.key`;
      await fs.writeFile(keyPath, val.publicKey);
      return { status: "uploaded" };
    } else {
      return { status: "authError" };
    }
  },

  msg(val: any) {
    console.log("msg", val);
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

const server = app.listen(3000, () => {
  console.log("ready");
});

server.on("upgrade", (request, socket: any, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});
