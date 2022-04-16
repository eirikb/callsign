const log = (
  logLevel: LogLevel,
  loggable: Loggable,
  text: string,
  subText?: string
) =>
  // Huh
  setTimeout(() =>
    loggable.lines.push({
      text: subText
        ? `[${new Date()
            .toISOString()
            .replace(/....Z/, "")
            .replace(/T/, " ")} ${subText}] ${text}`
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

export class Log {
  private readonly loggable: Loggable;

  constructor(loggable: Loggable) {
    this.loggable = loggable;
  }

  public info(text: string, subText?: string) {
    log("info", this.loggable, text, subText);
  }
}
