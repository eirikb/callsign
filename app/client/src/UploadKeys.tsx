import { data, don, path, React } from "./dd";
import {
  BackLink,
  Button,
  Input,
  Link,
  Panel,
  Status,
  TextArea,
} from "./components";
import { exportPrivateKey, exportPublicKey, generateKeys } from "./cryptomatic";
import { query } from "./transport";
import { UploadKeyQuery, UploadKeyReply } from "../../server/types";

async function submit(e: Event) {
  e.preventDefault();
  data.uploadKey.ok = true;
  data.uploadKey.showPrivateKey = false;
  data.uploadKey.status = "Creating key...";
  const keys = await generateKeys();
  data.uploadKey.status = "Exporting public key...";
  data.uploadKey.publicKey = await exportPublicKey(keys.publicKey);
  data.uploadKey.status = "Exporting private key...";
  data.uploadKey.privateKey = await exportPrivateKey(keys.privateKey);

  try {
    data.uploadKey.status = "Uploading key...";
    const res = await query<UploadKeyQuery, UploadKeyReply>("uploadKey", {
      callsign: data.uploadKey.callsign,
      password: data.uploadKey.password,
      publicKey: data.uploadKey.publicKey,
    });
    if (res.status === "uploaded") {
      data.uploadKey.status = "All is well!";
      data.uploadKey.showPrivateKey = true;

      data.home.callsign = data.uploadKey.callsign + ".callsign.network";
      data.home.key = data.uploadKey.privateKey;
    } else {
      data.uploadKey.status = "Wrong username and/or password";
      data.uploadKey.ok = false;
    }
  } catch (err: any) {
    data.uploadKey.status = err;
    data.uploadKey.ok = false;
  }
}

export const UploadKey = () => (
  <Panel>
    <BackLink />
    <div>
      This view will create a new key pair for you. <br />
      And upload the public key to the server.
    </div>
    <form onSubmit={submit}>
      <fieldset>
        <Input bind={path().uploadKey.callsign.$path} label="Username" />
        .callsign.network
        <Input
          bind={path().uploadKey.password.$path}
          label="Password"
          type="password"
        />
        <Button type="submit">Create keys and upload public key</Button>
        <Status
          okPath={path().uploadKey.ok}
          statusPath={path().uploadKey.status}
        />
      </fieldset>
    </form>

    {don(path().uploadKey.showPrivateKey)
      .filter((k) => k)
      .map(() => (
        <div>
          Copy the private key below and keep it safe. <br />
          Storing it in a password manager should be safe.
          <div>
            <textarea>{data.uploadKey.privateKey}</textarea>
          </div>
          <div>Your public key will be located here:</div>
          <div>
            <Link
              target={"_blank"}
              href={`https://${data.uploadKey.callsign}.callsign.network/${data.uploadKey.callsign}.callsign.network.key`}
            >
              {`https://${data.uploadKey.callsign}.callsign.network/${data.uploadKey.callsign}.callsign.network.key`}
            </Link>
          </div>
          <div>Your callsign is:</div>
          <div>
            <b>{data.uploadKey.callsign}.callsign.network</b>
          </div>
          <div>
            You can now got to front page a log in using this callsign and the
            key.
          </div>
          <p>
            Note: It can be a good idea to wait at least 1 minute before trying,{" "}
            <br /> in order for the server to set up a new domain with https .
          </p>
          <div>
            <Button type="button" onClick={() => (data.panel = "home")}>
              Go to home
            </Button>
          </div>
        </div>
      ))}
    <div>
      <BackLink />
    </div>
  </Panel>
);
