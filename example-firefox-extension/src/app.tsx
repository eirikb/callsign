import { data, don, init, pathOf, React } from "../../example-client/src/dd";
import { Chat, Init } from "../../example-client/src/views";
import { createLogger, toColor } from "../../example-client/src/log";

init(
  document.body,
  <div>
    {don(pathOf().panel).map<Panel>((panel) => {
      switch (panel) {
        case "chat":
          return (
            <div>
              <Chat />
              <hr />
              <b>Incoming:</b>
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const incoming = e.target.incoming.value;
                    try {
                      data.incoming = JSON.parse(incoming);
                      data.incoming = undefined;
                      e.target.incoming.value = "";
                    } catch (e) {
                      createLogger("").error(e);
                    }
                  }}
                >
                  <input name="incoming" type="text" />
                  <button>Process</button>
                </form>
              </div>
              <b>Outgoing:</b>
              <div>
                {don(pathOf().outgoing!).map((outgoing) => {
                  const input = (
                    <input type="text" value={JSON.stringify(outgoing)} />
                  );
                  return (
                    <div>
                      {input}
                      <button
                        type="button"
                        onClick={() => {
                          input.select();
                          document.execCommand("copy");
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
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
