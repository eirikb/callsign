import { on, don, data, path, React, reset, normalize } from "./dd";
import {
  encrypt,
  exportSecretKey,
  fetchKey,
  generateSecretKey,
  importPublicKey,
  importSecretKey,
  secretEncrypt,
} from "./cryptomatic";

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

async function sendData(session: Session, d: any) {
  if (session.key) {
    const secret = await importSecretKey(session.key);
    const [iv, cipher] = await secretEncrypt(secret, JSON.stringify(d));
    d = { from: data.home.callsign, iv, cipher };
  }

  session.outgoing = undefined;
  session.outgoing = Object.assign({ type: "msg" }, d);
}

on("+", path().chat.sessions.$, async (session: Session) => {
  if (session.direction === "incoming") {
    info(session, `Incoming session.`);
    await sendData(session, { action: "ok" });
    return;
  }

  info(session, "New session. Fetching key...");
  try {
    const publicKeyString = await fetchKey(session.callsign);
    if (publicKeyString) {
      info(session, `Importing public key...`);
      const publicKey = await importPublicKey(publicKeyString);
      info(session, "Generating new secret...");
      const secretKey = await generateSecretKey();
      const secret = await exportSecretKey(secretKey);
      info(session, `Encrypting secret with public key...`);
      const encrypted = await encrypt(
        publicKey,
        JSON.stringify({
          from: data.home.callsign,
          secret,
        })
      );
      info(session, `Sending secret...`);
      await sendData(currentSession(), { encrypted });
      session.key = secret;
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
            <div>
              <button class="flex items-center justify-center text-gray-400 hover:text-gray-600">
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
            </div>
            <div class="flex-grow ml-4">
              <div class="relative w-full">
                <input
                  bind={path().chat.text.$path}
                  type="text"
                  class="flex w-full border rounded-xl focus:outline-none focus:border-indigo-300 pl-4 h-10"
                />
                <button class="absolute flex items-center justify-center h-full w-12 right-0 top-0 text-gray-400 hover:text-gray-600">
                  <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div class="ml-4">
              <button class="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white px-4 py-1 flex-shrink-0">
                <span>Send</span>
                <span class="ml-2">
                  <svg
                    class="w-4 h-4 transform rotate-45 -mt-px"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);
