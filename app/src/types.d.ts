type MessageType = "key" | "key2" | "key3" | "msg";
type LogLevel = "info" | "important" | "success" | "warning" | "error";
type Panel = "init" | "chat";
type Store = "localStorage" | "sessionStorage" | "none";

interface Message {
  fromCallsign: string;
  toCallsign: string;
  type: MessageType;
}

interface MsgKey extends Message {
  key: string;
}

interface MsgKey2 extends Message {
  key: string;
  sign: string;
}

interface MsgKey3 extends Message {
  sign: string;
}

interface MsgMsg extends Message {
  text: string;
  iv: string;
}

interface Log {
  callsign?: string;
  level: LogLevel;
  text: string;
  stamp: Date;
}

interface Home {
  connecting: boolean;
  info: string;
  status: "black" | "green" | "red";
  callsign: string;
  store: boolean;
  key: string;
}

interface Data {
  panel: "main" | "home";
  home: Home;
}

interface Logger {
  info(text: string);

  important(text: string);

  warning(text: string);

  error(text: string);

  success(text: string);
}
