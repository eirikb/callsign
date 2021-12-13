// FML - like for real
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

import "./style.css";

import { don, data, init, path, React } from "./dd";
import { Home } from "./Home";
import { Chat } from "./Chat";
import { CreateKeys } from "./CreateKeys";
import "./transport";
// import "./master-of-chat";

init(
  document.body,
  <div>
    {don(path().panel).map((panel) => {
      switch (panel) {
        case "chat":
          return <Chat />;
        case "createKeys":
          return <CreateKeys />;
        default:
          return <Home />;
      }
    })}
  </div>
);
