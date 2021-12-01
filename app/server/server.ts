import * as express from "express";
import * as ws from "ws";

const app = express();

const listeners = {};

const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (socket) => {
  socket.on("message", (message) => {
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

const server = app.listen(3000);
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});
