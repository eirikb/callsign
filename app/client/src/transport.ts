// NO MORE FIREBASE!
// SO - SAY - WE - ALL!
// // Could be any type of transport, for this demo Firebase is used
// // Medium of transporting messages doesn't matter, they can't snoop
//
// import { initializeApp } from "firebase/app";
// import { GoogleAuthProvider, getAuth, signInWithRedirect } from "firebase/auth";
//
// import { getDatabase, remove, set, ref, onValue } from "firebase/database";
//
import { data, on, path } from "./dd";
import { normalize } from "./e2ee";
//
// const firebaseConfig = {
//   apiKey: " AIzaSyCyJPuz1e1-uuwgSe6JXjFjAXEc-oyG2ko",
//   authDomain: "callsign-c0af8.firebaseapp.com",
//   projectId: "callsign-c0af8",
//   storageBucket: "callsign-c0af8.appspot.com",
//   messagingSenderId: "858960654551",
//   appId: "1:858960654551:web:8cc6532ef2e37117b88092",
//   databaseURL:
//     "https://callsign-c0af8-default-rtdb.europe-west1.firebasedatabase.app/",
// };
// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);
// const auth = getAuth(app);
//
// console.log(auth);
// auth.onIdTokenChanged(console.log);
// auth.onAuthStateChanged(console.log);
//
// export async function google() {
//   const provider = new GoogleAuthProvider();
//
//   const res = await signInWithRedirect(auth, provider);
//   console.log(res);
// }
//
const ws = new WebSocket(`wss://${location.host}/api`);

let open = false;
const queue: any[] = [];

function send(v: any) {
  console.log("send", open, JSON.stringify(v));
  if (open) {
    ws.send(JSON.stringify(v));
  } else {
    queue.push(v);
  }
}

on("!+*", path().chat.sessions.$.outgoing, async (outgoing, { $ }) => {
  const session = data.chat.sessions[$];
  try {
    send({
      type: "msg",
      toCallsign: session.callsign,
      fromCallsign: data.home.callsign,
      value: outgoing,
    });
  } catch (e) {
    console.error(e);
    session.lines.push({
      text: "Fail: " + e,
      type: "error",
    });
  }
});

//

function listen() {
  const callsign = data.home.callsign;
  console.log("listen", callsign, "open", open);
  if (callsign) {
    console.log("send");
    send({ fromCallsign: callsign, type: "listen" });
    console.log("ok");
    //   set(ref(db, normalize(callsign)), null);
    //
    // ws.onmessage = () => {
    //   console.log("message", m);
    // };
    // if (val) {
    // }
  }
}

ws.addEventListener("open", () => {
  console.log("connected");
  open = true;
  for (let q of queue) send(q);
  ws.addEventListener("message", (m) => {
    console.log("message", m);
    const val = JSON.parse(m.data);
    console.log(val);
    const session = data.chat.sessions[normalize(val.fromCallsign)];
    if (session) {
      session.incoming = val;
    } else {
      data.chat.sessions[normalize(val.fromCallsign)] = {
        callsign: val.fromCallsign,
        lines: [],
        direction: "incoming",
        outgoing: undefined,
        incoming: val,
      };
    }
  });
});

on("+!*", path().home.callsign, listen);
//   (callsign) => {
// if (callsign) {
//   console.log(1);
// onValue(ref(db, normalize(callsign)), (snapshot) => {
// });
// }
// });
