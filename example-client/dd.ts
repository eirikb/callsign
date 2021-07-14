import domdom from "@eirikb/domdom";

const getItem = (key: string, or: string): string =>
  localStorage.getItem(key) || sessionStorage.getItem(key) || or;

const dd = domdom<Data>({
  callsign: getItem("callsign", ""),
  key: getItem("key", ""),
  store: getItem("store", "none") as Store,
  verified: false,
  panel: "init",
  log: [],
});

export const React = dd.React;
export const don = dd.don;
export const init = dd.init;
export const data = dd.data;
export const pathOf = dd.pathOf;
export const on = dd.on;
