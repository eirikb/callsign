import { data, don, path, React } from "./dd";
import { send } from "./transport";

function submit(e: Event) {
  e.preventDefault();

  console.log("LOGIN!");
}

function create() {
  console.log("CREATE!...");
  if (data.create.password !== data.create.password2) {
    data.create.status = "Passwords do not match";
    return;
  }

  data.create.status = "Creating...";
  const c = data.create;
  send({
    type: "create",
    value: {
      callsign: c.callsign,
      password: c.password,
    },
  });

  console.log("GO!");
  console.log(data.create);
}

function getKey(e: Event) {
  e.preventDefault();

  console.log("GET KEY!");

  const c = data.create;
  send({
    type: "get",
    value: {
      callsign: c.callsign,
      password: c.password,
    },
  });
}

export const Create = () => {
  return (
    <div class="flex h-screen">
      <div class="m-auto">
        <div class="p-8 shadow-lg rounded-xl text-center bg-white">
          <div class="flex flex-col">
            <a
              class="text-left text-blue-500 cursor-pointer"
              onClick={() => (data.panel = "home")}
            >
              Back
            </a>
            <p class="text-left">
              A test callsign is for demo/testing purposes. <br />
              The key will be stored on my server.
              <br />
              The server is an old laptop with full disk encryption, located at
              my home in Norway.
            </p>
            <p class="text-left">
              This means you not have full end-to-end encryption, since I will
              be, with some effort, able to decrypt the communication. <br />
              Creating a temporary key client-side would not help.
            </p>
          </div>
          <form onsubmit={submit}>
            <fieldset>
              <div class="pt-2 flex flex-col ml-20 mr-20">
                <div class="text-left">
                  <input
                    type="text"
                    required
                    bind={path().create.callsign.$path}
                    placeholder="Callsign"
                    class="p-1 rounded-lg bg-gray-100 shadow-md focus:outline-none focus:border-2 border-cyan-500"
                  />
                  .callsign.network
                </div>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  bind={path().create.password.$path}
                  class="p-1 mt-3 rounded-lg bg-gray-100 shadow-md focus:outline-none focus:border-2 border-cyan-500"
                />
                <div class="flex flex-row mx-auto">
                  <button
                    type="submit"
                    class="bg-cyan-200 p-2 pr-5 pl-5 text-gray-800 font-semibold border-cyan-700 focus:ring-2 m-4"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={getKey}
                    class="bg-cyan-200 p-2 pr-5 pl-5 text-gray-800 font-semibold border-cyan-700 focus:ring-2 m-4"
                  >
                    Get key
                  </button>
                </div>
                <div class="flex flex-row text-center">
                  <div class="h-4 border-0 border-b-2 flex-grow" />
                  <div class="pl-3 pr-3">or</div>
                  <div class="h-4 border-0 border-b-2 flex-grow" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Password again"
                  bind={path().create.password2.$path}
                  class="p-1 mt-3 rounded-lg bg-gray-100 shadow-md focus:outline-none focus:border-2 border-cyan-500"
                />
                <button
                  type="button"
                  onclick={create}
                  class="bg-cyan-200 p-2 pr-5 pl-5 text-gray-800 font-semibold border-cyan-700 focus:ring-2 m-4"
                >
                  Create
                </button>
                <div
                  class={don(path().create.ok).map((k) =>
                    k ? "text-black-500" : "text-red-500"
                  )}
                >
                  {don(path().create.status)}
                </div>
              </div>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
};
