// FML - like for real
// @ts-ignore
import { RegisterUser } from "./RegisterUser";

if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

import "./style.css";
// import {
//   decrypt,
//   encrypt,
//   exportPrivateKey,
//   exportPublicKey,
//   exportSecretKey,
//   generateKey,
//   generateKeys,
//   generateSecretKey,
//   importPrivateKey,
//   importPublicKey,
//   importSecretKey,
//   secretDecrypt,
//   secretEncrypt,
// } from "./cryptomatic";

import { don, data, init, path, React } from "./dd";
import { Home } from "./Home";
import { Chat } from "./Chat";
import { CreateKeys } from "./CreateKey";
import "./transport";
import { UploadKey } from "./UploadKeys";

init(
  document.body,
  <div>
    {don(path().panel).map((panel) => {
      switch (panel) {
        case "chat":
          return <Chat />;
        case "createKeys":
          return <CreateKeys />;
        case "registerUser":
          return <RegisterUser />;
        case "uploadKey":
          return <UploadKey />;
        default:
          return <Home />;
      }
    })}
  </div>
);
//
// console.log("ffs");
// (async () => {
//   const keyPair = await generateKeys();
//   console.log(keyPair);
//
//   const publicKeyString = await exportPublicKey(keyPair.publicKey);
//   console.log("publicKeyString", publicKeyString);
//   const privateKeyString = await exportPrivateKey(keyPair.privateKey);
//   console.log("privateKeyString", privateKeyString);
//
//   const publicKey = await importPublicKey(publicKeyString);
//   console.log("publicKey", publicKey);
//   const privateKey = await importPrivateKey(privateKeyString);
//   console.log("privateKey", privateKey);
//
//   const key = await generateSecretKey();
//   console.log("key", key);
//   const keyAsString = await exportSecretKey(key);
//   console.log("keyAsString", keyAsString);
//
//   const encrypted = await encrypt(
//     publicKey,
//     JSON.stringify({ from: "bob", key: keyAsString })
//   );
//   console.log("encrypted", encrypted);
//
//   const decrypted = await decrypt(privateKey, encrypted);
//   const secretKey = await importSecretKey(JSON.parse(decrypted).key);
//   console.log("secretKey", secretKey);
//
//   const encrypted2 = await secretEncrypt(secretKey, "Hello, world!");
//   console.log("encrypted2", JSON.stringify(encrypted2));
//   const decrypted2 = await secretDecrypt(
//     secretKey,
//     encrypted2[0],
//     encrypted2[1]
//   );
//   console.log("decrypted2", decrypted2);
// })();
