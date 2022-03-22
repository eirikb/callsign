type Store = "localStorage" | "sessionStorage" | "none";

interface From {
  sessionId: string;
  callsign: string;
}

interface Message {
  action: "key1" | "key2" | "key3" | "message";
  from: From;
}

interface MsgKey1 extends Message {
  publicDeriveKey: string;
}

interface MsgKey2 extends Message {
  publicDeriveKey: string;
  signed: string;
}

interface MsgKey3 extends Message {
  signed: string;
}

type Msg = MsgKey1 | MsgKey2 | MsgKey3 | undefined;

interface MsgMessage extends Message {
  sessionId: string;
  cipher: string;
  iv: string;
}

interface Home {
  disabled: boolean;
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

interface LogLine {
  level: LogLevel;
  text: string;
}

interface Loggable {
  lines: Line[];
}

interface Session extends Loggable {
  callsign: string;
  direction: "outgoing" | "incoming";
  active: boolean;
  sessionIds: { [sessionId: string]: { sessionId: string; key: CryptoKey } };
  plugId: number;
}

interface Chat extends Loggable {
  callsignToConnectTo: string;
  sessions: { [callsign: string]: Session };
  selectedSession: string;
  text: string;
  menuOpen: boolean;
}

interface CreateKey {
  publicKey: string;
  privateKey: string;
}

interface RegisterUser {
  callsign: string;
  password: string;
  password2: string;
  status: string;
  ok: boolean;
  showInfo: boolean;
}

interface UploadKey {
  callsign: string;
  password: string;
  publicKey: string;
  privateKey: string;
  status: string;
  ok: boolean;
  showPrivateKey: boolean;
}

interface Data {
  panel: "home" | "chat" | "createKeys" | "registerUser" | "uploadKey";
  connected: boolean;
  verified: boolean;
  plugged: boolean;
  home: Home;
  chat: Chat;
  createKey: CreateKey;
  registerUser: RegisterUser;
  uploadKey: UploadKey;
  plugId: number;
}
