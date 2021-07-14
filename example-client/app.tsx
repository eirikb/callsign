// @ts-ignore
import { onMessage, sendMessage } from "./transport";
import { data, don, init, on, pathOf, React } from "./dd";
import { toColor } from "./log";
import * as e2ee from "./e2ee";

function saveToStore(
  s: any,
  { callsign, key, store }: { callsign: string; key: string; store: string }
) {
  s.setItem(pathOf().callsign.$path, callsign);
  s.setItem(pathOf().key.$path, key);
  s.setItem(pathOf().store.$path, store);
}

async function verifyCallsign(e: Event) {
  e.preventDefault();
  // @ts-ignore
  const callsign = e.target.callsign.value;
  // @ts-ignore
  const key = e.target.key.value;
  // @ts-ignore
  const store = e.target.store.value;
  saveToStore(localStorage, { callsign: "", key: "", store: "" });
  saveToStore(sessionStorage, { callsign: "", key: "", store: "" });
  if (store === "localStorage")
    saveToStore(localStorage, { callsign, key, store });
  else if (store === "sessionStorage")
    saveToStore(sessionStorage, { callsign, key, store });

  data.callsign = callsign;
  data.key = key;
  data.store = store;

  await e2ee.verifyCallsign(callsign, key);
}

async function connectToCallsign(e: Event) {
  e.preventDefault();
  // @ts-ignore
  const callsign = e.target.callsign.value;
  await e2ee.connectToCallsign(callsign);
}

async function send(e: Event) {
  e.preventDefault();
  // @ts-ignore
  const callsign = e.target.callsign.value;
  // @ts-ignore
  const text = e.target.text.value;
  await e2ee.send(callsign, text);
}

const Init = () => (
  <form onsubmit={(e) => verifyCallsign(e)}>
    <div>
      <label>
        Callsign:
        <input name="callsign" type="text" value={data.callsign} />
      </label>
    </div>
    <div>
      <label>
        Key:
        <textarea name="key" cols="30" rows="10">
          {data.key}
        </textarea>
      </label>
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
    <form onsubmit={(e) => connectToCallsign(e)}>
      <div>Connect to callsign:</div>
      <div>
        <input name="callsign" type="text" />
        <button type="submit">Connect</button>
      </div>
    </form>
    <form onsubmit={(e) => send(e)}>
      <div>Send a message:</div>
      <div>
        <input name="callsign" type="text" />
        <input name="text" type="text" />
        <button type="submit">Send</button>
      </div>
    </form>
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
