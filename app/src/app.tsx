// FML - like for real
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.dispose(() => setTimeout(() => location.reload(), 200));
}

import "./style.css";

import { don, data, init, path, React } from "./dd";
import { Home } from "./Home";
import { Main } from "./Main";
import "./transport";

init(
  document.body,
  <div>
    {don(path().panel.$path).map((panel) => {
      switch (panel) {
        case "main":
          return <Main />;
        default:
          return <Home />;
      }
    })}
  </div>
);
