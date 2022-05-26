/***
 * This file handles all of Callsign communication and logic.
 * Does not depend on any kind of library. Can be plugged into any browser or
 * any system with Web Crypto API such as Deno.
 *
 * Global dependencies: Web Crypto and WebSocket.
 */

import {
  derive,
  exportPublicKey,
  exportSecretKey,
  fetchKey,
  generateDeriveKeys,
  importPrivateSignKey,
  importPublicDeriveKey,
  importPublicSignKey,
  sign,
  verify,
  encrypt,
  decrypt,
} from "./cryptomatic";

export type PlugId = string;

export type Step = {
  key1?: {
    publicDeriveKeyImported?(): void;
    deriveKeyGenerated?(): void;
    secretDerived?(): void;
    secretKeyExported?(): void;
    signed?(): void;
    publicKeyExported?(): void;
  };
  key2?: {
    publicDeriveKeyImported?(): void;
    secretDerived?(): void;
    secretExported?(): void;
    keyVerified?(verified: boolean): void;
    signed?(): void;
  };
  key3?: {
    decrypted?(): void;
    publicKeyFetched?(): void;
    publicSignKeyImported?(): void;
    secretKeyExported?(): void;
    keyVerified?(verified: boolean): void;
  };
  connect?: {
    connected?(): void;
    closed?(): void;
    plugged?(): void;
  };
  verifyOwn?: {
    keyImported?(): void;
    publicKeyFetched?(): void;
    publicKeyImported?(): void;
    publicSignKeyImported?(): void;
    signed?(): void;
    keyVerified?(verified: boolean): void;
  };
  hail?: {
    plugged?(): void;
    publicVerifyKeyImported?(): void;
    deriveKeyGenerated?(): void;
    publicKeyExported?(): void;
  };
  message?: (data: any) => void | undefined;
  decrypted?: (callsign: string, data: any) => void | undefined;
  send?: (action: "p" | "s", topic: string, data: any) => void | undefined;
  onError?(error: Error): void;
};

export class Com {
  private mainChan: Chan;
  private steps: Step[] = [];
  private privateDeriveKeys: { [callsign: string]: CryptoKey } = {};
  private pendingSecret: { [plugId: PlugId]: CryptoKey } = {};
  private pipes: {
    [plugId: PlugId]: {
      callsign: string;
      chan: Chan;
      topic: string;
      secret: CryptoKey;
    };
  } = {};
  private pipeConnections: { [callsign: string]: PlugId[] } = {};
  private pendingVerifyKey: { [callsign: string]: CryptoKey } = {};
  private privateKey: CryptoKey | undefined;
  private callsign?: string;

  addPipe(
    callsign: string,
    plugId: PlugId,
    chan: Chan,
    topic: string,
    secret: CryptoKey
  ) {
    this.pipeConnections[callsign] = this.pipeConnections[callsign] || [];
    this.pipeConnections[callsign].push(plugId);

    this.pipes[plugId] = { callsign, chan, topic, secret };
  }

  constructor() {
    const self = this;
    this.mainChan = new Chan([
      {
        message(data: any) {
          (async () => {
            if (data.a === "key1") {
              const chan = new Chan(
                self.steps.concat([
                  {
                    message(data: any) {
                      (async () => {
                        if (data.a === "key3") {
                          const secret = self.pendingSecret[chan.plugId!];
                          const decrypted = JSON.parse(
                            await decrypt(secret, data.iv, data.encrypted)
                          );
                          self.steps.forEach((step) =>
                            step.key3?.decrypted?.()
                          );

                          const verifyKeyString = await fetchKey(
                            decrypted.callsign
                          );
                          self.steps.forEach((step) =>
                            step.key3?.publicKeyFetched?.()
                          );

                          const verifyKey = await importPublicSignKey(
                            verifyKeyString
                          );
                          self.steps.forEach((step) =>
                            step.key3?.publicSignKeyImported?.()
                          );
                          const exportedSecret = await exportSecretKey(secret);
                          self.steps.forEach((step) =>
                            step.key3?.secretKeyExported?.()
                          );
                          const verified = await verify(
                            verifyKey,
                            decrypted.signed,
                            exportedSecret
                          );
                          self.steps.forEach((step) =>
                            step.key3?.keyVerified?.(verified)
                          );

                          const [iv, encrypted] = await encrypt(
                            secret,
                            "greetings"
                          );

                          self.addPipe(
                            decrypted.callsign,
                            chan.plugId!,
                            chan,
                            data.plugId,
                            secret
                          );

                          await chan.send("p", data.plugId, {
                            a: "key4",
                            plugId: chan.plugId,
                            iv,
                            encrypted,
                          });
                        } else if (data.a === "msg") {
                          if (self.pipes[data.plugId]) {
                            const { secret, callsign } =
                              self.pipes[data.plugId];
                            const decrypted = await decrypt(
                              secret,
                              data.iv,
                              data.encrypted
                            );
                            self.steps.forEach((step) =>
                              step.decrypted?.(callsign, decrypted)
                            );
                          }
                        }
                      })();
                    },
                  },
                ])
              );
              await chan.onPlugged;
              const publicDeriveKey = await importPublicDeriveKey(
                data.publicDeriveKey
              );
              self.steps.forEach((step) =>
                step.key1?.publicDeriveKeyImported?.()
              );
              const deriveKeys = await generateDeriveKeys();
              self.steps.forEach((step) => step.key1?.deriveKeyGenerated?.());
              const secret = await derive(
                publicDeriveKey,
                deriveKeys.privateKey
              );
              self.steps.forEach((step) => step.key1?.secretDerived?.());
              const exportedSecret = await exportSecretKey(secret);
              self.steps.forEach((step) => step.key1?.secretKeyExported?.());
              const signed = await sign(self.privateKey, exportedSecret);
              self.steps.forEach((step) => step.key1?.signed?.());
              const myPublicDeriveKey = await exportPublicKey(
                deriveKeys.publicKey
              );
              self.steps.forEach((step) => step.key1?.publicKeyExported?.());

              self.pendingSecret[chan.plugId!] = secret;
              await chan.send("p", data.plugId, {
                a: "key2",
                plugId: chan.plugId,
                publicDeriveKey: myPublicDeriveKey,
                signed: signed,
              });
            }
          })();
        },
      },
    ]);
  }

  onPlugged() {
    return this.mainChan.onPlugged;
  }

  onStep(step: Step) {
    this.steps.push(step);
    this.mainChan.steps.push(step);
  }

  async verify(callsign: string, key: string): Promise<boolean> {
    try {
      this.privateKey = await importPrivateSignKey(key);
      this.steps.forEach((step) => step.verifyOwn?.keyImported?.());
      const publicKeyString = await fetchKey(callsign);
      this.steps.forEach((step) => step.verifyOwn?.publicKeyFetched?.());
      const publicKey = await importPublicSignKey(publicKeyString);
      this.steps.forEach((step) => step.verifyOwn?.publicSignKeyImported?.());
      const d = window.btoa("Hello, world!");
      const signed = await sign(this.privateKey, d);
      this.steps.forEach((step) => step.verifyOwn?.signed?.());
      const verified = await verify(publicKey, signed, d);
      this.steps.forEach((step) => step.verifyOwn?.keyVerified?.(verified));
      if (verified) {
        this.callsign = callsign;
        this.mainChan.send("s", callsign);
      }
      return verified;
    } catch (e: any) {
      this.steps.forEach((step) => step.onError?.(e));
    }
    return false;
  }

  async hail(callsign: string): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      const self = this;
      const chan = new Chan(
        this.steps.concat([
          {
            message(data: any) {
              (async () => {
                if (data.a === "key2") {
                  const publicDeriveKey = await importPublicDeriveKey(
                    data.publicDeriveKey
                  );
                  self.steps.forEach((step) =>
                    step.key2?.publicDeriveKeyImported?.()
                  );

                  const privateDeriveKey = self.privateDeriveKeys[callsign];
                  const secret = await derive(
                    publicDeriveKey,
                    privateDeriveKey
                  );
                  self.pendingSecret[data.plugId] = secret;
                  self.steps.forEach((step) => step.key2?.secretDerived?.());
                  const exportedSecret = await exportSecretKey(secret);
                  self.steps.forEach((step) => step.key2?.secretExported?.());
                  const verifyKey = self.pendingVerifyKey[callsign];
                  const verified = await verify(
                    verifyKey,
                    data.signed,
                    exportedSecret
                  );
                  self.steps.forEach((step) =>
                    step.key2?.keyVerified?.(verified)
                  );
                  if (verified) {
                    const signed = await sign(self.privateKey, exportedSecret);
                    self.steps.forEach((step) => step.key2?.signed?.());

                    const [iv, encrypted] = await encrypt(
                      secret,
                      JSON.stringify({
                        signed,
                        callsign: self.callsign,
                      })
                    );

                    await chan.send("p", data.plugId, {
                      plugId: chan.plugId,
                      a: "key3",
                      iv,
                      encrypted,
                    });
                  }
                } else if (data.a === "key4") {
                  const secret = self.pendingSecret[data.plugId];
                  const decrypted = await decrypt(
                    secret,
                    data.iv,
                    data.encrypted
                  );

                  self.addPipe(
                    callsign,
                    data.plugId,
                    chan,
                    data.plugId,
                    secret
                  );

                  resolve(decrypted === "greetings");
                } else if (data.a === "msg") {
                  if (self.pipes[data.plugId]) {
                    const { secret } = self.pipes[data.plugId];
                    const decrypted = await decrypt(
                      secret,
                      data.iv,
                      data.encrypted
                    );
                    self.steps.forEach((step) =>
                      step.decrypted?.(callsign, decrypted)
                    );
                  }
                }
              })();
            },
          },
        ])
      );

      const [verifyKeyString] = await Promise.all([
        fetchKey(callsign),
        chan.onPlugged,
      ]);
      self.steps.forEach((step) => step.hail?.plugged?.());
      if (verifyKeyString) {
        this.pendingVerifyKey[callsign] = await importPublicSignKey(
          verifyKeyString
        );
        self.steps.forEach((step) => step.hail?.publicVerifyKeyImported?.());
        const deriveKeys = await generateDeriveKeys();
        self.steps.forEach((step) => step.hail?.deriveKeyGenerated?.());
        const publicDeriveKey = await exportPublicKey(deriveKeys.publicKey);
        self.steps.forEach((step) => step.hail?.publicKeyExported?.());
        this.privateDeriveKeys[callsign] = deriveKeys.privateKey!;
        chan.send("p", callsign, {
          a: "key1",
          plugId: chan.plugId,
          publicDeriveKey,
        });
      }
    });
  }

  async message(callsign: string, text: string) {
    return Promise.all(
      (this.pipeConnections[callsign] ?? []).flatMap(async (con) => {
        if (this.pipes[con]) {
          const { chan, topic, secret } = this.pipes[con];
          const [iv, encrypted] = await encrypt(secret, text);
          await chan.send("p", topic, {
            a: "msg",
            plugId: con,
            iv,
            encrypted,
          });
        }
      })
    );
  }
}

class Chan {
  private ws: WebSocket;
  plugId: PlugId | undefined = undefined;

  private pluggedResolve: () => void = () => {};
  onPlugged = new Promise<void>((resolve) => {
    this.pluggedResolve = resolve;
  });

  constructor(public steps: Step[]) {
    this.ws = this.connect();
  }

  connect() {
    this.ws = new WebSocket(
      `${location.protocol === "http:" ? "ws" : "wss"}://${location.host}/relay`
    );
    this.ws.addEventListener("open", () =>
      this.steps.forEach((step) => step.connect?.connected?.())
    );
    this.ws.addEventListener("message", async (m) => {
      const val = JSON.parse(m.data);
      this.steps.forEach((step) => step.message?.(val));
      if (val.a === "plugged") {
        this.plugId = val.id;
        this.pluggedResolve();
        this.steps.forEach((step) => step.connect?.plugged?.());
      }
    });

    this.ws.addEventListener("close", () => {
      this.steps.forEach((step) => step.connect?.closed?.());
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

  send(action: "p" | "s", topic: string, data: any = undefined) {
    this.onPlugged.then(() => {
      this.steps.forEach((step) => step?.send?.(action, topic, data));
      this.ws?.send(
        JSON.stringify({
          a: action,
          t: topic,
          d: data,
        })
      );
    });
  }
}
