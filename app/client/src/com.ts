/***
 * This file handles all of Callsign communication and logic.
 * Does not depend on any kind of library. Can be plugged into any browser or
 * any system with Web Crypto API such as Deno.
 */

import {
  fetchKey,
  importPrivateSignKey,
  importPublicSignKey,
  sign,
  verify,
} from "./cryptomatic";

export type Step = {
  connect?:
    | {
        connected();
        closed();
        plugged();
      }
    | undefined;
  verify?:
    | {
        ownKeyImported();
        ownPublicKeyFetched();
        ownPublicKeyImported();
        ownKeyVerified(verified: boolean);
      }
    | undefined;
  onError?(error: Error);
};

export class Com {
  private sessions: { [key: string]: Session } = {};
  public mainChan: Chan;
  private steps: Step[] = [];

  constructor() {
    this.mainChan = new Chan(this.steps);
  }

  addStep(step: Step) {
    this.steps.push(step);
  }

  verify(callsign: string, key: string) {
    (async () => {
      const privateKey = await importPrivateSignKey(key);
      this.steps.forEach((step) => step.verify?.ownKeyImported());
      const publicKeyString = await fetchKey(callsign);
      this.steps.forEach((step) => step.verify?.ownPublicKeyFetched());
      const publicKey = await importPublicSignKey(publicKeyString);
      const d = window.btoa("Hello, world!");
      const signed = await sign(privateKey, d);
      const verified = await verify(publicKey, signed, d);
      this.steps.forEach((step) => step.verify?.ownKeyVerified(verified));
    })().then(
      () => {},
      (e) => {
        this.steps.forEach((step) => step.onError?.(e));
      }
    );
  }
}

export type PlugId = number;

export class Session {
  private pipes: [Chan, PlugId][] = [];
}

export class Chan extends EventTarget {
  private ws: WebSocket;
  plugId: PlugId | undefined = undefined;

  constructor(private steps: Step[]) {
    super();
    this.ws = this.connect();
  }

  connect() {
    this.ws = new WebSocket(
      `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}/relay`
    );
    this.ws.addEventListener("open", () =>
      this.steps.forEach((step) => step.connect?.connected())
    );
    this.ws.addEventListener("message", async (m) => {
      const val = JSON.parse(m.data);
      // console.log(">", val);
      if (val.a === "plugged") {
        this.plugId = val.id;
        this.steps.forEach((step) => step.connect?.plugged());
      } else {
        // this.dispatchEvent(new CustomEvent("message", { detail: val }));
      }
    });

    this.ws.addEventListener("close", () => {
      this.steps.forEach((step) => step.connect?.closed());
      setTimeout(this.connect, 1000);
    });
    this.ws.addEventListener("error", (err) => {
      this.steps.forEach((step) =>
        step.onError?.((err.target as Error | null) ?? new Error(""))
      );
      this.ws?.close();
    });

    return this.ws;
  }

  async send(action: "p" | "s", topic: string, data: any = undefined) {
    this.ws?.send(
      JSON.stringify({
        a: action,
        t: topic,
        d: data,
      })
    );
  }
}
