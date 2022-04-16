import domdom from "@eirikb/domdom";
import { Com } from "./com";

const getItem = (key: string, or: string): string =>
  localStorage.getItem(key) || sessionStorage.getItem(key) || or;

const initial: Data = {
  panel: "home",
  connected: false,
  verified: false,
  plugged: false,
  home: {
    disabled: true,
    store: getItem("store", "false") === "true",
    callsign: getItem("callsign", ""),
    key: "",
    status: "black",
    info: "",
  },
  chat: {
    callsignToConnectTo: "",
    sessions: {},
    selectedSession: "",
    text: "",
    menuOpen: false,
    lines: [
      {
        type: "info",
        text: "Welcome to Callsign!",
      },
    ],
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

export const com = new Com();
