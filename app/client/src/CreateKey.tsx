import { data, don, path, React } from "./dd";
import { exportPrivateKey, exportPublicKey, generateKey } from "./cryptomatic";
import { BackLink, Button, Input, Panel, TextArea } from "./components";

async function createKey() {
  const keys = await generateKey();
  data.createKey.publicKey = await exportPublicKey(keys.publicKey);
  data.createKey.privateKey = await exportPrivateKey(keys.privateKey);
}

export const CreateKeys = () => (
  <Panel>
    <BackLink />
    <TextArea bind={path().createKey.publicKey.$path} label="Public key" />
    <Input bind={path().createKey.privateKey.$path} label="Private key" />
    <Button onClick={createKey}>Create keys</Button>
  </Panel>
);
