import domdom from "@eirikb/domdom";

const getItem = (key: string, or: string): string =>
  localStorage.getItem(key) || sessionStorage.getItem(key) || or;

const initial: Data = {
  panel: "home",
  connected: false,
  home: {
    store: getItem("store", "false") === "true",
    callsign: getItem("callsign", ""),
    key: "",
    connecting: false,
    status: "black",
    info: "",
  },
  chat: {
    callsignToConnectTo: "",
    sessions: {},
    selectedSession: "",
    text: "",
  },
  createKey: {
    publicKey: "",
    privateKey: "",
  },
  registerUser: {
    callsign: "",
    password: "",
    password2: "",
    status: "",
    ok: false,
    showInfo: false,
  },
  uploadKey: {
    callsign: "",
    password: "",
    status: "",
    ok: false,
    publicKey: "",
    privateKey: "",
    showPrivateKey: false,
  },
  flow: {
    subFlow: "init",
  },
};

const dd = domdom<Data>(initial);

export const reset = () => {
  for (const [key, value] of Object.entries(initial)) {
    dd.set(key, value);
  }
};

export const React = dd.React;
export const don = dd.don;
export const init = dd.init;
export const data = dd.data;
export const path = dd.path;
export const on = dd.on;

export const normalize = (str: string) => str.replace(/\./g, "_").trim();
