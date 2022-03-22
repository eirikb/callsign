import { queryTypes } from "../../server-relay/types";

let ws: WebSocket | undefined = undefined;

export class Channel extends EventTarget {
  ws: WebSocket;
  plugId: number | undefined = undefined;

  constructor() {
    super();
    this.ws = this.connect();
  }

  on<T>(eventName: string, cb?: (value: T) => void): Promise<T> {
    return new Promise((r) => {
      this.addEventListener(eventName, (event) => {
        const val = (event as CustomEvent<T>).detail;
        console.log(eventName, val);
        r(val);
        if (cb) cb(val);
      });
    });
  }

  onConnect = (cb?: () => void) => this.on("connect", cb);
  onPlugged = (cb?: (number) => void): Promise<number> =>
    this.on("plugged", cb);
  onClose = (cb: () => void) => this.on("close", cb);
  onMessage = <T>(cb: (data: T) => void) => this.on("message", cb);
  onError = (cb: (e: any) => void) => this.on("error", cb);

  connect() {
    const ws = new WebSocket(
      `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}/relay`
    );
    ws.addEventListener("open", () => {
      console.log("Connected");
      this.dispatchEvent(new Event("connect"));
    });
    // @ts-ignore
    ws.addEventListener("message", async (m) => {
      const val = JSON.parse(m.data);
      console.log(">", val);
      if (val.a === "plugged") {
        this.plugId = val.id;
        this.dispatchEvent(new CustomEvent("plugged", { detail: val.id }));
      } else {
        this.dispatchEvent(new CustomEvent("message", val));
      }
    });

    ws.addEventListener("close", () => {
      this.dispatchEvent(new Event("close"));
      console.log("reconnect");
      setTimeout(this.connect, 1000);
    });
    ws.addEventListener("error", (err) => {
      console.error(err);
      this.dispatchEvent(new Event("error", err));
      ws.close();
    });

    return ws;
  }

  async send(action: "p" | "s", topic: string, data: any = undefined) {
    ws?.send(
      JSON.stringify({
        a: action,
        t: topic,
        d: data,
      })
    );
  }

  async sendData<T extends Msg>(loggable: Loggable, topic: string, data: any) {
    try {
      await this.send("p", topic, data);
    } catch (e) {
      console.error(e);
      loggable.lines.push({
        text: "Fail: " + e,
        type: "error",
      });
    }
  }

  async query<T, R>(type: queryTypes, data: T): Promise<R> {
    return fetch(`/demo/${type}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((r) => r.json()) as unknown as R;
  }
}
