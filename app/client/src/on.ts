import { data, on, path } from "./dd";
// import { syncDevices, onSession, onKey1 } from "./master-of-chats";
import { connect } from "./Home";
// import { Channel } from "./channel";
// import { info } from "./log";

const domainifyi = (url: string): string =>
  (url || "").toLowerCase().replace(" ", "");

on("!+*", path().home.callsign, (c) => {
  data.home.callsign = domainifyi(c);
});
on("!+*", path().registerUser.callsign, (c) => {
  data.registerUser.callsign = domainifyi(c);
});
on("!+*", path().uploadKey.callsign, (c) => {
  data.uploadKey.callsign = domainifyi(c);
});

on("!+*", path().connected, (connected) => {
  if (!connected) return;
  try {
    data.home = JSON.parse(localStorage.getItem("home") ?? "");
    // ffs
    setTimeout(() => {
      if (data.home.key) {
        connect().catch(console.error);
      }
    });
  } catch (ignored) {
    setTimeout(() => {
      data.home.disabled = false;
    });
  }
});

on("!+*", path().verified, (verified) => {
  if (verified) {
    // Ensure listeners are called and ready
    // setTimeout(async () => {
    //   await syncDevices();
    // }, 3000);
  }
});

on("+", path().chat.sessions.$, async (session: Session) => {
  if (session.direction === "incoming") {
    return;
  }

  // await onSession(session);
});

export function dealWithChannel(channel: Channel) {
  channel.onMessage(async (d) => {
    console.log("  !!", channel.plugId, d);
    if (d.action === "key1") {
      // info(data.chat, `New incoming session`, d.from.plugId);
      // await onKey1(data.chat, d.from.plugId, d);
    }
  });
}

// on("+!*", path().verified, (verified) => {
//   if (verified) {
//     // console.log("OK!");
//     // listen();
//   }
// });
