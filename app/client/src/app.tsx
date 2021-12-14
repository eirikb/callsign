// FML - like for real
// @ts-ignore
import { RegisterUser } from "./RegisterUser";

if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

import "./style.css";

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
