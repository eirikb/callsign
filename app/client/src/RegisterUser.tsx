import { data, don, path, React } from "./dd";
import { BackLink, Button, Input, Panel, Status } from "./components";
import { query } from "./channel";
import { RegisterUserQuery, RegisterUserReply } from "../../server-relay/types";

async function submit(e: Event) {
  e.preventDefault();
  data.registerUser.ok = true;
  data.registerUser.showInfo = false;
  if (data.registerUser.password !== data.registerUser.password2) {
    data.registerUser.status = "Passwords do not match";
    data.registerUser.ok = false;
    return;
  }

  data.registerUser.status = "Creating...";
  const c = data.registerUser;
  try {
    const res = await query<RegisterUserQuery, RegisterUserReply>(
      "registerUser",
      {
        callsign: c.callsign,
        password: c.password,
      }
    );
    if (res.status == "created") {
      data.registerUser.status = "Created!";
      data.registerUser.showInfo = true;
      data.uploadKey.callsign = data.registerUser.callsign;
      data.uploadKey.password = data.registerUser.password;
    } else {
      data.registerUser.ok = false;
      data.registerUser.status = "Already exists";
    }
  } catch (err: any) {
    data.registerUser.status = err;
    data.registerUser.ok = false;
  }
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
        The server is a laptop with full disk encryption, located at my home in
        Norway.
      </p>
      <form onSubmit={submit}>
        <fieldset>
          <p class="text-left">
            This means you will not have full end-to-end encryption, since I
            will, with some effort, <br /> be able to decrypt the communication.
          </p>
          <Input
            required={true}
            label="Username"
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
          {don(path().registerUser.showInfo)
            .filter((k) => k)
            .map(() => (
              <div>
                <div>
                  User registered, you can now create and upload a new key.
                </div>
                <Button
                  type="button"
                  onClick={() => (data.panel = "uploadKey")}
                >
                  Go to key upload
                </Button>
              </div>
            ))}
        </fieldset>
      </form>
      <div>
        <BackLink />
      </div>
    </Panel>
  );
};
