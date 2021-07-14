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

export const info = (text: string, callsign: string | undefined = undefined) =>
  log("info", text, callsign);
export const bold = (text: string, callsign: string | undefined = undefined) =>
  log("bold", text, callsign);
export const warning = (
  text: string,
  callsign: string | undefined = undefined
) => log("warning", text, callsign);
export const error = (text: string, callsign: string | undefined = undefined) =>
  log("error", text, callsign);
export const success = (
  text: string,
  callsign: string | undefined = undefined
) => log("success", text, callsign);

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
