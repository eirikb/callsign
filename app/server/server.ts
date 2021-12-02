import express from "express";
import ws from "ws";

const app = express();

const listeners: { [key: string]: any } = {};

const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (socket) => {
  socket.on("message", (message: any) => {
    const d = JSON.parse(message);
    console.log(d);
    if (d.type === "listen") {
      listeners[d.fromCallsign] = socket;
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
