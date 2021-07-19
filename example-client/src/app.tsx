// @ts-ignore
import { onMessage, sendMessage } from "./transport";
import { data, don, init, on, pathOf, React } from "./dd";
import { createLogger, toColor } from "./log";
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

const Init = () => (
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

const Chat = () => (
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

on("!+*", pathOf().verified, (verified) => {
  if (verified) {
    onMessage<MsgKey>(data.callsign, "key", e2ee.onKey);
    onMessage<MsgKey2>(data.callsign, "key2", e2ee.onKey2);
    onMessage<MsgKey3>(data.callsign, "key3", e2ee.onKey3);
    onMessage<MsgMsg>(data.callsign, "msg", e2ee.onMessage);
  }
});

init(
  document.body,
  <div>
    {don(pathOf().panel).map<Panel>((panel) => {
      switch (panel) {
        case "chat":
          return <Chat />;
        default:
          return <Init />;
      }
    })}
    <hr />
    <div>
      {don(pathOf().log.$).map<Log>((log) => (
        <div style={{ color: toColor(log) }}>
          [{log.stamp.toISOString()}]{" "}
          {log.callsign ? (
            <span style="color: blue">{log.callsign}</span>
          ) : null}{" "}
          {log.text}
        </div>
      ))}
    </div>
  </div>
);
