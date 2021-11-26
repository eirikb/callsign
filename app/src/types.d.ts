type MessageType = "key" | "key2" | "key3" | "msg";
type LogLevel = "info" | "important" | "success" | "warning" | "error";
type Panel = "init" | "chat";
type Store = "localStorage" | "sessionStorage" | "none";

interface Message {
  fromCallsign: string;
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

interface Home {
  connecting: boolean;
  info: string;
  status: "black" | "green" | "red";
  callsign: string;
  store: boolean;
  key: string;
}

type LogLevel = "info" | "warning" | "error";

interface Line {
  type: "from" | "to" | LogLevel;
  text: string;
}

interface Session {
  callsign: string;
  visible: boolean;
  direction: "outgoing" | "incoming";
  lines: Line[];
  outgoing: MsgMsg | MsgKey | MsgKey2 | MsgKey3 | undefined;
  incoming: MsgMsg | MsgKey | MsgKey2 | MsgKey3 | undefined;
}

interface Chat {
  callsignToConnectTo: string;
  sessions: Session[];
}

interface Data {
  panel: "home" | "chat";
  home: Home;
  chat: Chat;
}
