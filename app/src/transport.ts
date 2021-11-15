// Could be any type of transport, for this demo Firebase is used
// Medium of transporting messages doesn't matter, they can't snoop

import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { data, on, path } from "./dd";

const firebaseConfig = {
  apiKey: "AIzaSyDAdFbdaEjLk_qQwGGZGKYur5OghPwNIeE",
  authDomain: "callsign-c0af8.firebaseapp.com",
  projectId: "callsign-c0af8",
  storageBucket: "callsign-c0af8.appspot.com",
  messagingSenderId: "858960654551",
  appId: "1:858960654551:web:8cc6532ef2e37117b88092",
};
const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {});

on("!+*", path().outgoing!.$path, async (outgoing) => {
  const m = outgoing as Message;
  outgoing.stamp = serverTimestamp();
  await db.collection(m.toCallsign).add(outgoing);
});

on("!+*", path().verified, (verified) => {
  if (verified) {
    db.collection(data.callsign)
      .where("stamp", ">=", Timestamp.now())
      .limitToLast(1)
      .orderBy("stamp")
      .onSnapshot((snapshot) =>
        snapshot.forEach((d) => {
          data.incoming = d.data() as Message;
          data.incoming = undefined;
        })
      );
  }
});
