import { data, on, don, path, React } from "./dd";
import { Button, Input, Panel } from "./components";
import {
  decrypt,
  encrypt,
  fetchKey,
  importPrivateKey,
  importPublicKey,
} from "./cryptomatic";

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
  try {
    data.home.info = "Importing private key...";
    const privateKey = await importPrivateKey(data.home.key);
    data.home.info = "Loading public key...";
    const publicKeyString = await fetchKey(data.home.callsign);
    data.home.info = "Importing public key...";
    const publicKey = await importPublicKey(publicKeyString);
    data.home.info = "Verifying keys...";
    const encrypted = await encrypt(publicKey, "Hello, world!");
    const output = await decrypt(privateKey, encrypted);
    if (output === "Hello, world!") {
      data.home.status = "green";
      data.home.info = "VERIFIED!";
      setTimeout(() => {
        data.panel = "chat";
      }, 500);
    } else {
      data.home.status = "red";
      data.home.info = "Unable to verify keys";
    }
  } catch (e) {
    console.error(e);
    data.home.info = "red";
    data.home.info = "Unable to load key";
  }
  data.home.connecting = false;
}

export const Home = () => (
  <Panel>
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
          <Input bind={path().home.callsign.$path} label="Callsign (domain)" />
          <Input
            bind={path().home.key.$path}
            label="Key (Certificate key)"
            type="password"
          />
          <div class="text-gray-500">Password managers supported</div>
          <label class="text-gray-500">
            <input type="checkbox" bind={path().home.store.$path} /> Save
            details locally
          </label>
        </div>
        <Button type="submit">Connect</Button>
        <div
          class={don(path().home.status.$path).map(
            (s) => `text-left text-${s}-600`
          )}
        >
          {don(path().home.info)}
        </div>
      </fieldset>
    </form>
    <div class="flow flow-col">
      <div>
        <Button onClick={() => (data.panel = "createKeys")}>Create keys</Button>
      </div>
      <div>
        <Button onClick={() => (data.panel = "registerUser")}>
          Register test/demo user
        </Button>
      </div>
      <div>
        <Button onClick={() => (data.panel = "uploadKey")}>
          Create + upload test/demo keys
        </Button>
      </div>
    </div>
    <div>
      <a href="https://github.com/eirikb/callsign#callsign" target="_blank">
        How it works
      </a>
    </div>
  </Panel>
);
