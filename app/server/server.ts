import * as express from "express";
import * as ws from "ws";
import * as db from "./super-advanced-database";

const app = express();

const listeners: { [key: string]: any } = {};

const send = (socket: ws.WebSocket, data: any) =>
  socket.send(JSON.stringify(data));

const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (socket) => {
  console.log("connection!");
  socket.on("message", async (message: any) => {
    const d = JSON.parse(message);
    console.log(d);
    if (d.type === "listen") {
      listeners[d.fromCallsign] = socket;
    } else if (d.type === "create") {
      console.log("CREATE!", d.value);
      const ok = await db.set(d.value);
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
    } else if (d.type === "get") {
      const e = db.get(d.callsign);
      if (e != undefined && e.password === d.password) {
        send(socket, {
          type: "get",
          ok: true,
        });
      } else {
        send(socket, {
          type: "get",
          ok: false,
          status: "Wrong password",
        });
      }
    } else {
      const to = listeners[d.toCallsign];
      console.log("to", to);
      if (to) to.send(JSON.stringify(d.value));
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
