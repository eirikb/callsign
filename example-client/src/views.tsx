import { data, don, pathOf, React } from "./dd";
import { createLogger } from "./log";
import * as e2ee from "./e2ee";

function saveToStore(
  s: any,
  { callsign, key, store }: { callsign: string; key: string; store: string }
) {
  s.setItem(pathOf().callsign.$path, callsign);
  s.setItem(pathOf().key.$path, key);
  s.setItem(pathOf().store.$path, store);
}

function event(
  cb: (logger: Logger, target: EventTarget | null) => Promise<void>
) {
  return (e: Event) => {
    e.preventDefault();
    const logger = createLogger(e.target?.["callsign"]?.value);
    cb(logger, e.target).catch(logger.error);
  };
}

async function verifyCallsign(
  logger: Logger,
  target: EventTarget | null
): Promise<void> {
  // @ts-ignore
  const callsign = target.callsign.value;
  // @ts-ignore
  const key = target.key.value;
  // @ts-ignore
  const store = target.store.value;
  saveToStore(localStorage, { callsign: "", key: "", store: "" });
  saveToStore(sessionStorage, { callsign: "", key: "", store: "" });
  if (store === "localStorage")
    saveToStore(localStorage, { callsign, key, store });
  else if (store === "sessionStorage")
    saveToStore(sessionStorage, { callsign, key, store });

  data.callsign = callsign;
  data.key = key;
  data.store = store;

  await e2ee.verifyCallsign(logger);
}

async function connectToCallsign(logger, target: EventTarget | null) {
  // @ts-ignore
  const callsign = target.callsign.value;
  await e2ee.connectToCallsign(logger, callsign);
}

async function send(logger: Logger, target: EventTarget | null) {
  // @ts-ignore
  const callsign = target.callsign.value;
  // @ts-ignore
  const text = target.text.value;
  await e2ee.send(logger, callsign, text);
}

export const Init = () => (
  <form onsubmit={event(verifyCallsign)}>
    <div>
      <input
        name="callsign"
        type="text"
        value={data.callsign}
        placeholder="Callsign"
      />
    </div>
    <div>
      <textarea name="key" cols="30" rows="10" placeholder="Key">
        {data.key}
      </textarea>
    </div>
    <div>
      {["localStorage", "sessionStorage", "none"].map((store) => (
        <div>
          <label>
            <input
              name="store"
              type="radio"
              value={store}
              checked={data.store === store}
            />
            Store key in {store}
          </label>
        </div>
      ))}
    </div>
    <div>
      <button type="submit">Verify</button>
    </div>
    <div>
      <button
        type="submit"
        disabled={don(pathOf().verified).map((v) => !v)}
        onclick={() => (data.panel = "chat")}
      >
        Connect
      </button>
    </div>
  </form>
);

export const Chat = () => (
  <div>
    Welcome {data.callsign}
    <form onsubmit={event(connectToCallsign)}>
      <div>Connect to callsign:</div>
      <div>
        <input name="callsign" type="text" placeholder="Callsign" />
        <button type="submit">Connect</button>
      </div>
    </form>
    <div>Send a message:</div>
    {don(pathOf().callsigns.$).map<string>((callsign) => (
      <form onsubmit={event(send)}>
        <div>
          <input
            name="callsign"
            type="text"
            placeholder="Callsign"
            value={callsign}
          />
          <input name="text" type="text" placeholder="Text" />
          <button type="submit">Send</button>
        </div>
      </form>
    ))}
  </div>
);
