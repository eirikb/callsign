import { data, don, path, React } from "./dd";
import { exportPrivateKey, exportPublicKey, generateKeys } from "./cryptomatic";
import { BackLink, Button, Input, Panel, TextArea } from "./components";

async function createKey() {
  const keys = await generateKeys();
  data.createKey.publicKey = await exportPublicKey(keys.publicKey);
  data.createKey.privateKey = await exportPrivateKey(keys.privateKey);
}

export const CreateKeys = () => (
  <Panel>
    <BackLink />
    <div class="text-left">
      This page is used to generate a public and private key. <br />
      Both keys are generated and shown client-side in your browser. <br />
      The public key is used to encrypt data. <br />
      The private key is used to decrypt data. <br />
      You put the public key on your server as: <br />
      <b>https://your-callsign.com/your-callsign.com.key</b> <br />
      The private key you keep secret. Using a password manager is recommended.{" "}
      <br />
    </div>
    <TextArea bind={path().createKey.publicKey.$path} label="Public key" />
    <Input bind={path().createKey.privateKey.$path} label="Private key" />
    <Button onClick={createKey}>Create keys</Button>
    <div>
      <BackLink />
    </div>
  </Panel>
);
