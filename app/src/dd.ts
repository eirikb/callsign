import domdom from "@eirikb/domdom";

const getItem = (key: string, or: string): string =>
  localStorage.getItem(key) || sessionStorage.getItem(key) || or;

const dd = domdom<Data>({
  panel: "init",
  home: {
    store: getItem("store", "false") === "true",
    callsign: getItem("callsign", ""),
    key: "",
    connecting: false,
    status: "black",
    info: "",
  },
});

export const React = dd.React;
export const don = dd.don;
export const init = dd.init;
export const data = dd.data;
export const path = dd.path;
export const on = dd.on;
