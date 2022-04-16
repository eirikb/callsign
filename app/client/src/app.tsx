// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

import "./style.css";

import { don, init, path, React, com } from "./dd";
import { Home } from "./Home";
import { Chat } from "./Chat";
import { CreateKeys } from "./CreateKey";
import { RegisterUser } from "./RegisterUser";
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
