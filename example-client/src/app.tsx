import { don, init, pathOf, React } from "./dd";
import { toColor } from "./log";
import { Chat, Init } from "./views";

init(
  document.body,
  <div>
    {don(pathOf().panel).map<Panel>((panel) => {
      switch (panel) {
        case "chat":
          return <Chat />;
        default:
          return <Init />;
      }
    })}
    <hr />
    <div>
      {don(pathOf().log.$).map<Log>((log) => (
        <div style={{ color: toColor(log) }}>
          [{log.stamp.toISOString()}]{" "}
          {log.callsign ? (
            <span style="color: blue">{log.callsign}</span>
          ) : null}{" "}
          {log.text}
        </div>
      ))}
    </div>
  </div>
);
