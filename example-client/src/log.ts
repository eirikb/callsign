import { data } from "./dd";

export const log = (
  level: LogLevel,
  text: string,
  callsign: string | undefined = undefined
) =>
  data.log.push({
    callsign,
    level,
    stamp: new Date(),
    text,
  });

export const toColor = (log: Log) => {
  switch (log.level) {
    case "info":
      return "grey";
    case "success":
      return "green";
    case "warning":
      return "orange";
    case "error":
      return "red";
    default:
      return "black";
  }
};

export const hex = (data: Buffer | string): string => {
  const s = typeof data === "string" ? data : data.toString("hex");
  return s.slice(0, 5).concat("...").concat(s.slice(-5));
};

export const createLogger = (callsign: string): Logger => ({
  info: (text: string) => log("info", text, callsign),
  success: (text: string) => log("success", text, callsign),
  important: (text: string) => log("important", text, callsign),
  warning: (text: string) => log("warning", text, callsign),
  error: (text: string) => log("error", text, callsign),
});
