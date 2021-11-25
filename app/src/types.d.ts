type MessageType = "key" | "key2" | "key3" | "msg";
type LogLevel = "info" | "important" | "success" | "warning" | "error";
type Panel = "init" | "chat";
type Store = "localStorage" | "sessionStorage" | "none";

// interface Message {
//   // fromCallsign: string;
//   // toCallsign: string;
//   direction: "from" | "to" | "internal";
//   type: MessageType;
// }
//
// interface MsgKey extends Message {
//   key: string;
// }
//
// interface MsgKey2 extends Message {
//   key: string;
//   sign: string;
// }
//
// interface MsgKey3 extends Message {
//   sign: string;
// }
//
// interface MsgMsg extends Message {
//   text: string;
//   iv: string;
// }

interface Home {
  connecting: boolean;
  info: string;
  status: "black" | "green" | "red";
  callsign: string;
  store: boolean;
  key: string;
}

interface Message {
  direction: "from" | "to" | "internal";
  text: string;
}

interface Session {
  callsign: string;
  visible: boolean;
  messages: Message[];
}

interface Main {
  sessions: Session[];
}

interface Data {
  panel: "main" | "home";
  home: Home;
  main: Main;
}
