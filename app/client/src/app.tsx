// FML - like for real
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

import { RegisterUser } from "./RegisterUser";
import "./style.css";

import { don, on, data, init, path, React } from "./dd";
import { Home } from "./Home";
import { Chat } from "./Chat";
import { CreateKeys } from "./CreateKey";
import "./transport";
import { UploadKey } from "./UploadKeys";

const domainifyis = (url: string): string =>
  (url || "").toLowerCase().replace(" ", "");

on("!+*", path().home.callsign, (c) => {
  data.home.callsign = domainifyis(c);
});
on("!+*", path().registerUser.callsign, (c) => {
  data.registerUser.callsign = domainifyis(c);
});
on("!+*", path().uploadKey.callsign, (c) => {
  data.uploadKey.callsign = domainifyis(c);
});

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
