import * as ws from "ws";

const subscriptions: { [key: string]: any[] } = {};

const wsServer = new ws.Server({ port: 3001 }, () => {
  console.log("Relay ready");
});

wsServer.on("connection", (socket) => {
  console.log("connection!");

  socket.on("message", async (message: any) => {
    const d = JSON.parse(message);
    console.log(d);
    if (typeof d.a !== "string" || typeof d.t !== "string") return;
    const publish = d.a === "p";
    const subscribe = d.a === "s";
    const topic = d.t;
    const data = d.d;

    if (subscribe) {
      subscriptions[topic] = subscriptions[topic] || [];
      subscriptions[topic]?.push(socket);
      const s = socket as any;
      s.topics = s.topics || new Set();
      s.topics.add(topic);
      socket.send(JSON.stringify({ a: "plugged" }));
    } else if (publish && data) {
      subscriptions[topic]?.forEach((s) => s.send(JSON.stringify(data)));
    }
  });

  socket.on("close", () => {
    const topics = (socket as any).topics as Set<string>;
    if (topics) {
      topics.forEach((topic) => {
        subscriptions[topic] =
          subscriptions[topic]?.filter((s) => s !== socket) || [];
        if (subscriptions[topic]?.length === 0) {
          delete subscriptions[topic];
        }
      });
    }
  });
});
