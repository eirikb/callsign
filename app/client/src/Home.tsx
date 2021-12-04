import { data, on, don, path, React } from "./dd";
import { fetchCert, normalizeKey, verifyCert } from "./e2ee";

on("!+*", path().connected, (c) => {
  if (c) {
    try {
      data.home = JSON.parse(localStorage.getItem("home") ?? "");
      // ffs
      setTimeout(() => {
        if (data.home.key) {
          connect();
        }
      });
    } catch (ignored) {}
  }
});

async function submit(event: Event) {
  event.preventDefault();
  await connect();
}

async function connect() {
  if (data.home.store) {
    localStorage.setItem("home", JSON.stringify(data.home));
  } else {
    localStorage.removeItem("home");
  }

  data.home.connecting = true;
  data.home.status = "black";
  data.home.info = "Loading certificate...";
  try {
    const cert = await fetchCert(data.home.callsign);
    data.home.info = "Verifying cert...";
    const key = normalizeKey(data.home.key);
    if (verifyCert(cert, key)) {
      data.home.status = "green";
      data.home.info = "VERIFIED!";
      setTimeout(() => {
        data.panel = "chat";
      }, 500);
    } else {
      data.home.status = "red";
      data.home.info = "Unable to verify certificate";
    }
  } catch (e) {
    console.error(e);
    data.home.info = "red";
    data.home.info = "Unable to load cert";
  }
  data.home.connecting = false;
}

export const Home = () => {
  return (
    <div class="flex h-screen">
      <div class="m-auto">
        <div class="p-8 shadow-lg rounded-xl text-center bg-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="inline h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h1 class="text-3xl font-bold text-blue-500">Callsign</h1>
          <h3 class="text-1xl font-semibold text-gray-500">
            Connect with your callsign
          </h3>
          <form onsubmit={submit}>
            <fieldset disabled={don(path().home.connecting.$path)}>
              <div class="text-left pt-3">
                <input
                  type="text"
                  required
                  bind={path().home.callsign.$path}
                  placeholder="Callsign (domain)"
                  class="p-1 rounded-lg bg-gray-100 shadow-md focus:outline-none focus:border-2 border-cyan-500"
                />
                <input
                  type="password"
                  required
                  placeholder="Key (Certificate key)"
                  bind={path().home.key.$path}
                  class="block p-1 mt-3 rounded-lg bg-gray-100 shadow-md focus:outline-none focus:border-2 border-cyan-500"
                />
                <div class="text-gray-500">Password managers supported</div>
                <label class="text-gray-500">
                  <input type="checkbox" bind={path().home.store.$path} /> Save
                  details locally
                </label>
              </div>
              <button
                type="submit"
                class="bg-cyan-200 p-2 pr-5 pl-5 text-gray-800 font-semibold border-cyan-700 focus:ring-2 m-4"
              >
                Connect
              </button>
              <div
                class={don(path().home.status.$path).map(
                  (s) => `text-left text-${s}-600`
                )}
              >
                {don(path().home.info)}
              </div>
            </fieldset>
          </form>
          <div>
            <button
              type="submit"
              class="bg-cyan-200 p-2 pr-5 pl-5 text-gray-800 font-semibold border-cyan-700 focus:ring-2 m-4"
              onclick={() => (data.panel = "create")}
            >
              Create test callsign
            </button>
          </div>
          <div>
            <a
              href="https://github.com/eirikb/callsign#callsign"
              target="_blank"
            >
              How it works
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
