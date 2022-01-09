import * as ws from "ws";
// import { WebSocket } from "ws";

const listeners: { [key: string]: any[] } = {};

// const send = (socket: ws.WebSocket, data: any) => {
//   console.log("<", data);
//   socket.send(JSON.stringify(data));
// };

const wsServer = new ws.Server({ port: 3001 }, () => {
  console.log("Relay ready");
});

wsServer.on("connection", (socket) => {
  console.log("connection!");

  socket.on("message", async (message: any) => {
    const d = JSON.parse(message);
    console.log(">", d);
    // const action: any = actions[d.type];
    // try {
    //   if (action) {
    //     const res = await action(d, socket);
    //     if (res) {
    //       send(socket, Object.assign({ type: "reply" }, res));
    //     }
    //   } else {
    //     console.log("Unknown action", action, d);
    //     send(socket, {
    //       error: `Unknown action ${d.type}`,
    //       type: "reply",
    //     });
    //   }
    // } catch (e) {
    //   send(socket, { error: e.message, type: "reply" });
    // }
  });

  socket.on("close", () => {
    console.log("CLOSE!...");
    const listenerList = listeners[(socket as any).callsign];
    if (listenerList) {
      const index = listenerList.indexOf(socket);
      console.log("index", index);
      console.log("before", listenerList.length);
      listenerList.splice(index, 1);
      console.log("after", listenerList.length);
    }
  });
});

// server.on("upgrade", (request, socket: any, head) => {
//   wsServer.handleUpgrade(request, socket, head, (socket) => {
//     wsServer.emit("connection", socket, request);
//   });
// });
