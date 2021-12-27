// FML - like for real
if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

import { RegisterUser } from "./RegisterUser";
import "./style.css";

import { don, data, init, path, React } from "./dd";
import { Home } from "./Home";
import { Chat } from "./Chat";
import { CreateKeys } from "./CreateKey";
import "./transport";
import { UploadKey } from "./UploadKeys";
import { Flow } from "./Flow";

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
        case "flow":
          return <Flow />;
        default:
          return <Home />;
      }
    })}
  </div>
);
