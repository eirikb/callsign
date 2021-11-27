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
import "./transport";
import "./master-of-chat";

init(
  document.body,
  <div>
    {don(path().panel.$path).map((panel) => {
      switch (panel) {
        case "chat":
          return <Chat />;
        default:
          return <Home />;
      }
    })}
  </div>
);
