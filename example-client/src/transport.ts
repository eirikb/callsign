// Could be any type of transport, for this demo Firebase is used
// Medium of transporting messages doesn't matter, they can't snoop

import firebase from "firebase";
import "firebase/firestore";

import { data, on, pathOf } from "./dd";

const firebaseConfig = {
  apiKey: "AIzaSyDAdFbdaEjLk_qQwGGZGKYur5OghPwNIeE",
  authDomain: "callsign-c0af8.firebaseapp.com",
  projectId: "callsign-c0af8",
  storageBucket: "callsign-c0af8.appspot.com",
  messagingSenderId: "858960654551",
  appId: "1:858960654551:web:8cc6532ef2e37117b88092",
};
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

on("!+*", pathOf().outgoing!.$path, async (outgoing) => {
  const m = outgoing as Message;
  outgoing.stamp = firebase.firestore.FieldValue.serverTimestamp();
  await db.collection(m.toCallsign).add(outgoing);
});

on("!+*", pathOf().verified, (verified) => {
  if (verified) {
    db.collection(data.callsign)
      .where("stamp", ">=", firebase.firestore.Timestamp.now())
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
