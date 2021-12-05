type MessageType = "key" | "key2" | "key3" | "msg";
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

type LogLevel = "info" | "warning" | "error" | "success";

interface Line {
  type: "from" | "to" | LogLevel;
  text: string;
}

interface Session {
  callsign: string;
  direction: "outgoing" | "incoming";
  lines: Line[];
  outgoing: MsgMsg | MsgKey | MsgKey2 | MsgKey3 | undefined;
  incoming: MsgMsg | MsgKey | MsgKey2 | MsgKey3 | undefined;
}

interface Chat {
  callsignToConnectTo: string;
  sessions: { [callsign: string]: Session };
  selectedSession: string;
  text: string;
}

interface Create {
  callsign: string;
  password: string;
  password2: string;
  status: string;
  ok: boolean;
}

interface Data {
  panel: "home" | "chat" | "create";
  connected: boolean;
  home: Home;
  chat: Chat;
  create: Create;
}
