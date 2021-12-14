import { data, don, path, React } from "./dd";
import { BackLink, Button, Input, Panel, Status, TextArea } from "./components";
import { exportPrivateKey, exportPublicKey, generateKey } from "./cryptomatic";

async function submit(e: Event) {
  console.log(1);
  e.preventDefault();
  data.uploadKey.ok = true;
  data.uploadKey.status = "Creating key...";
  const keys = await generateKey();
  data.uploadKey.status = "Exporting public key...";
  data.uploadKey.publicKey = await exportPublicKey(keys.publicKey);
  data.uploadKey.status = "Exporting private key...";
  data.createKey.privateKey = await exportPrivateKey(keys.privateKey);
}

export const UploadKey = () => (
  <Panel>
    <BackLink />
    <form onSubmit={submit}>
      <fieldset>
        <Input bind={path().uploadKey.callsign.$path} label="Callsign" />
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
  </Panel>
);
