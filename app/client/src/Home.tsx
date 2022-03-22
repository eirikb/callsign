import { data, don, path, React } from "./dd";
import { Button, Input, Panel, SmallButton } from "./components";
import {
  fetchKey,
  importPrivateSignKey,
  importPublicSignKey,
  sign,
  verify,
} from "./cryptomatic";
import { Channel } from "./transport";

async function submit(event: Event) {
  event.preventDefault();
  await connect();
}

(async () => {
  data.home.info = "Connecting...";
  const channel = new Channel();
  await channel.onConnect();
  data.home.info = "Connected! Waiting for plug...";
  const id = await channel.onPlugged();
  data.home.info = `Plugged! ${id}`;
})();

export async function connect() {
  if (data.home.store) {
    localStorage.setItem("home", JSON.stringify(data.home));
  } else {
    localStorage.removeItem("home");
  }

  data.home.disabled = true;
  data.home.status = "black";
  try {
    data.home.info = "Importing private sign key...";
    const privateKey = await importPrivateSignKey(data.home.key);
    data.home.info = "Loading public key...";
    const publicKeyString = await fetchKey(data.home.callsign);
    data.home.info = "Importing public sign key...";
    const publicKey = await importPublicSignKey(publicKeyString);
    data.home.info = "Verifying keys...";
    const d = window.btoa("Hello, world!");
    const signed = await sign(privateKey, d);
    const verified = await verify(publicKey, signed, d);
    data.verified = verified;
    if (verified) {
      data.home.status = "green";
      data.home.info = "Callsign verified. Plugging in...";
    } else {
      data.home.status = "red";
      data.home.info = "Unable to verify keys";
    }
  } catch (e) {
    console.error(e);
    data.home.status = "red";
    data.home.info = "Unable to load key";
  }
  data.home.disabled = false;
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
      <b>True </b>
      end-to-end encryption
    </h3>
    <form onsubmit={submit}>
      <fieldset disabled={don(path().home.disabled.$path)}>
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
          class={don(path().home.status.$path).map((s) =>
            s === "red"
              ? "text-red-600"
              : s === "green"
              ? "text-green-600"
              : "text-black-600"
          )}
        >
          {don(path().home.info)}
        </div>
      </fieldset>
    </form>

    <hr class="mt-3 mb-3" />

    <div class="flow flow-col">
      <p>Don't have a callsign?</p>
      <div>
        <SmallButton onClick={() => (data.panel = "createKeys")}>
          Create key pair
        </SmallButton>
      </div>
      <div>
        <SmallButton onClick={() => (data.panel = "registerUser")}>
          Register demo user
        </SmallButton>
      </div>
      <div>
        <SmallButton onClick={() => (data.panel = "uploadKey")}>
          Create demo keys
        </SmallButton>
      </div>
    </div>
  </Panel>
);
