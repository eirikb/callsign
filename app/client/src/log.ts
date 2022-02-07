export const log = (
  logLevel: LogLevel,
  loggable: Loggable,
  text: string,
  callsign?: string
) =>
  // Huh
  setTimeout(() =>
    loggable.lines.push({
      text: callsign
        ? `[${new Date()
            .toISOString()
            .replace(/....Z/, "")
            .replace(/T/, " ")} ${callsign}] ${text}`
        : text,
      type: logLevel,
    })
  );

export const info = (loggable: Loggable, text: string, callsign?: string) =>
  log("info", loggable, text, callsign);
export const success = (loggable: Loggable, text: string, callsign?: string) =>
  log("success", loggable, text, callsign);
export const warning = (loggable: Loggable, text: string, callsign?: string) =>
  log("warning", loggable, text, callsign);
export const error = (loggable: Loggable, text: string, callsign?: string) =>
  log("error", loggable, text, callsign);
