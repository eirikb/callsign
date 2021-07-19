type MessageType = "key" | "key2" | "key3" | "msg";
type LogLevel = "info" | "important" | "success" | "warning" | "error";
type Panel = "init" | "chat";
type Store = "localStorage" | "sessionStorage" | "none";

interface MsgKey {
  key: string;
  callsign: string;
}

interface MsgKey2 {
  key: string;
  sign: string;
  callsign: string;
}

interface MsgKey3 {
  sign: string;
  callsign: string;
}

interface MsgMsg {
  text: string;
  iv: string;
  callsign: string;
}

interface Message<T> {
  stamp: Date;
  type: MessageType;
  data: T;
}

interface Log {
  callsign?: string;
  level: LogLevel;
  text: string;
  stamp: Date;
}

interface Data {
  callsign: string;
  key: string;
  store: Store;
  verified: boolean;
  log: Log[];
  panel: Panel;
  callsigns: string[];
}

interface Logger {
  info(text: string);

  important(text: string);

  warning(text: string);

  error(text: string);

  success(text: string);
}
