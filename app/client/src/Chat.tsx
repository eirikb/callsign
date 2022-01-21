import { data, don, normalize, on, path, React, reset } from "./dd";
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
} from "./cryptomatic";

// TODO:
setTimeout(() => {
  if (data.home.callsign === "a.callsign.network") {
    data.chat.sessions[normalize("b.callsign.network")] = {
      callsign: "b.callsign.network",
      direction: "outgoing",
      incoming: undefined,
      key: undefined,
      lines: [],
      outgoing: undefined,
    };
    data.chat.selectedSession = normalize("b.callsign.network");
  }
}, 2000);

const log = (logLevel: LogLevel, session: Session, text: string) =>
  session.lines.push({
    text,
    type: logLevel,
  });

const info = (session: Session, text: string) => log("info", session, text);
const success = (session: Session, text: string) =>
  log("success", session, text);
const warning = (session: Session, text: string) =>
  log("warning", session, text);
const error = (session: Session, text: string) => log("error", session, text);

function currentSession() {
  return data.chat.sessions[normalize(data.chat.selectedSession)];
}

async function sendData<T>(session: Session, d: T) {
  if (session.key) {
    // const secret = await importSecretKey(session.key);
    // const [iv, cipher] = await secretEncrypt(secret, JSON.stringify(d));
    // d = { from: data.home.callsign, iv, cipher };
  }

  session.outgoing = undefined;
  session.outgoing = d;
}

on("!+*", path().chat.sessions.$.incoming, async (incomingRaw: any, { $ }) => {
  const session = data.chat.sessions[$];
  const action = incomingRaw.action;
  if (action === "key1") {
    info(session, `Incoming session.`);
    const incoming = incomingRaw as MsgKey1;
    info(session, `Importing public derive key...`);
    const publicDeriveKey = await importPublicDeriveKey(
      incoming.publicDeriveKey
    );
    info(session, `Generating new derive key...`);
    const deriveKeys = await generateDeriveKeys();
    info(session, `Creating new secret...`);
    const secret = await derive(publicDeriveKey, deriveKeys.privateKey);
    info(session, "Exporting secret...");
    const exportedSecret = await exportSecretKey(secret);
    info(session, `Importing sign key...`);
    const signKey = await importPrivateSignKey(data.home.key);
    info(session, `Signing secret...`);
    const signed = await sign(signKey, exportedSecret);
    info(session, "Exporting public derive key...");
    const myPublicDeriveKey = await exportPublicKey(deriveKeys.publicKey);

    info(session, "Sending public derive key + signed...");
    await sendData<MsgKey2>(session, {
      action: "key2",
      publicDeriveKey: myPublicDeriveKey,
      signed,
    });
  } else if (action === "key2") {
    const incoming = incomingRaw as MsgKey2;
    console.log(JSON.stringify(session));
    // Huh
    setTimeout(() => {
      info(session, `Importing public derive key...`);
    }, 100);
    // const publicDeriveKey = await importPublicDeriveKey(
    //   incoming.publicDeriveKey
    // );
  }
});

on("+", path().chat.sessions.$, async (session: Session) => {
  if (!data.chat.selectedSession) {
    // Huh
    setTimeout(() => {
      data.chat.selectedSession = session.callsign;
    }, 100);
  }
  console.log(session.incoming?.action);
  // await sendData(session, { action: "ok" });
  if (session.direction === "incoming") {
    return;
  }

  info(
    session,
    `New session. Fetching key from https://${session.callsign}/${session.callsign}.key ...`
  );
  try {
    const verifyKeyString = await fetchKey(session.callsign);
    if (verifyKeyString) {
      info(session, `Importing public sign key...`);
      const verifyKey = await importPublicSignKey(verifyKeyString);
      info(session, "Generating new derive key...");
      const deriveKeys = await generateDeriveKeys();
      info(session, "Exporting public derive key...");
      const publicDeriveKey = await exportPublicKey(deriveKeys.publicKey);
      info(session, "Sending public key...");
      await sendData<MsgKey1>(session, {
        action: "key1",
        publicDeriveKey,
      });
    } else {
      warning(session, "Key failed");
    }
  } catch (e) {
    error(session, `${e}`);
  }
});

function connect(e: Event) {
  e.preventDefault();

  const callsign = data.chat.callsignToConnectTo;
  data.chat.sessions[normalize(callsign)] = {
    lines: [],
    direction: "outgoing",
    callsign,
    outgoing: undefined,
    incoming: undefined,
  };

  data.chat.callsignToConnectTo = "";
  data.chat.selectedSession = callsign;
}

async function send(e: Event) {
  e.preventDefault();
  const text = data.chat.text;
  await sendData(currentSession(), { text });
  currentSession().lines.push({
    text,
    type: "from",
  });
  data.chat.text = "";
}

function logout() {
  localStorage.clear();
  reset();
}

export const Chat = () => (
  <div class="flex h-screen text-gray-800">
    <div class="w-12 flex flex-row h-full w-full overflow-x-hidden">
      <div
        class={don(path().chat.menuOpen).map(
          (open) =>
            `flex flex-col py-8 md:pl-6 sm:pl-0 pr-2 w-12 md:w-64 bg-white overflow-hidden flex-shrink-0 ${
              open ? "w-64" : ""
            }`
        )}
      >
        <div
          class="md:hidden mb-6 ml-1"
          onClick={() => (data.chat.menuOpen = !data.chat.menuOpen)}
        >
          <svg viewBox="0 0 100 80" width="40" height="40">
            <rect width="100" height="20" />
            <rect y="30" width="100" height="20" />
            <rect y="60" width="100" height="20" />
          </svg>
        </div>
        <div class="flex flex-row items-center justify-center h-12 w-full">
          <div class="ml-2 font-bold text-xl">
            {don(path().home.callsign)}
            <button
              class="rounded bg-blue-200 text-gray-500 mb-5 p-1"
              onclick={logout}
            >
              Log out
            </button>
          </div>
        </div>
        <form class="ml-2" onSubmit={connect}>
          <label>New Session</label>
          <input
            required
            bind={path().chat.callsignToConnectTo.$path}
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            placeholder="Callsign"
          />
          <button class="bg-gray-100 mt-2 text-gray-700 text-base font-semibold px-6 py-2 rounded-lg">
            Connect
          </button>
        </form>
        <div class="flex flex-col mt-8">
          <div class="flex flex-col space-y-1 mt-4 -mx-2 h-48 overflow-y-auto">
            {don(path().chat.sessions.$).map((s) => (
              <button
                class="flex flex-row items-center hover:bg-gray-100 rounded-xl p-2"
                onclick={() => (data.chat.selectedSession = s.callsign)}
              >
                <div class="flex items-center justify-center h-8 w-8 bg-indigo-200 rounded-full">
                  {s.callsign.slice(0, 1)}
                </div>
                <div class="ml-2 text-sm font-semibold">{s.callsign}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div class="flex flex-col flex-auto h-full p-6">
        <div class="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4">
          <div class="flex flex-col h-full overflow-x-auto mb-4">
            <div class="flex flex-col-reverse overflow-y-scroll h-full">
              <div class="grid grid-cols-12 gap-y-2">
                {don(path().chat.selectedSession).map((s) => {
                  const session = data.chat.sessions[normalize(s)];
                  if (!session) return "";

                  return don(path(session).lines.$).map((m) => {
                    switch (m.type) {
                      case "from":
                        return (
                          <div class="col-start-1 col-end-8 p-3 rounded-lg">
                            <div class="flex flex-row items-center">
                              <div class="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                                {data.home.callsign.slice(0, 1)}
                              </div>
                              <div class="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                                <div>{m.text}</div>
                              </div>
                            </div>
                          </div>
                        );
                      case "to":
                        return (
                          <div class="col-start-6 col-end-13 p-3 rounded-lg">
                            <div class="flex items-center justify-start flex-row-reverse">
                              <div class="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                                {s.slice(0, 1)}
                              </div>
                              <div class="relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl">
                                <div>{m.text}</div>
                              </div>
                            </div>
                          </div>
                        );

                      default:
                        return (
                          <div class="col-start-1 col-end-8 rounded-lg">
                            <div class="flex items-center justify-start flex-row-reverse">
                              <div
                                class={
                                  m.type === "error"
                                    ? "text-red-500"
                                    : m.type === "info"
                                    ? "text-blue-500"
                                    : m.type === "success"
                                    ? "text-green-500"
                                    : m.type === "warning"
                                    ? "text-yellow-500"
                                    : "text-gray-500"
                                }
                              >
                                {m.text}
                              </div>
                            </div>
                          </div>
                        );
                    }
                  });
                })}
              </div>
            </div>
          </div>
          <form
            class="flex flex-row items-center h-16 rounded-xl bg-white w-full px-4"
            onsubmit={send}
          >
            <div class="flex-grow ml-4">
              <div class="relative w-full">
                <input
                  bind={path().chat.text.$path}
                  type="text"
                  class="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                  placeholder="Type a message..."
                />
              </div>
            </div>
            <div class="ml-4">
              <button class="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);
