import { data, don, path, React } from "./dd";
import { BackLink, Button, Input, Panel, Status } from "./components";
import { send } from "./transport";

function submit(e: Event) {
  e.preventDefault();
  data.registerUser.ok = true;
  if (data.registerUser.password !== data.registerUser.password2) {
    data.registerUser.status = "Passwords do not match";
    data.registerUser.ok = false;
    return;
  }

  data.registerUser.status = "Creating...";
  const c = data.registerUser;
  send({
    type: "registerUser",
    value: {
      callsign: c.callsign,
      password: c.password,
    },
  });
}

export const RegisterUser = () => {
  return (
    <Panel>
      <BackLink />
      <p class="text-left">
        A test callsign is for demo/testing purposes. <br />
        The public key will be stored on my server. Private key never leaves
        your device.
        <br />
        The server is an old laptop with full disk encryption, located at my
        home in Norway.
      </p>
      <form onSubmit={submit}>
        <fieldset>
          <p class="text-left">
            This means you will not have full end-to-end encryption, since I
            will be, with some effort, able to decrypt the communication.
          </p>
          <Input
            required={true}
            label="Callsign"
            bind={path().registerUser.callsign.$path}
          />
          .callsign.network
          <Input
            required={true}
            label="Password"
            bind={path().registerUser.password.$path}
            type="password"
          />
          <Input
            required={true}
            label="Password again"
            bind={path().registerUser.password2.$path}
            type="password"
          />
          <Button type="submit">Create</Button>
          <Status
            okPath={path().registerUser.ok}
            statusPath={path().registerUser.status}
          />
          {don(path().registerUser.ok)
            .filter((k) => k)
            .map(() => (
              <Button type="button" onClick={() => (data.panel = "uploadKey")}>
                Go to upload
              </Button>
            ))}
        </fieldset>
      </form>
    </Panel>
  );
};
