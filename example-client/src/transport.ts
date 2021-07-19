// Could be any type of transport, for this demo Firebase is used
// Medium of transporting messages doesn't matter, they can't snoop

import firebase from "firebase";
import "firebase/firestore";
import { createLogger } from "./log";

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

export const sendMessage = async <T>(
  channel: string,
  type: MessageType,
  data: T
) =>
  db.collection(channel).add({
    stamp: firebase.firestore.FieldValue.serverTimestamp(),
    type,
    data,
  });

export const onMessage = <T>(
  channel: string,
  type: MessageType,
  cb: (logger: Logger, message: T) => void
) =>
  db
    .collection(channel)
    .where("stamp", ">=", firebase.firestore.Timestamp.now())
    .limitToLast(1)
    .orderBy("stamp")
    .onSnapshot((snapshot) =>
      snapshot.forEach((d) => {
        const m = d.data() as Message<T>;
        const logger = createLogger(m.data["callsign"]);
        try {
          if (m.type === type && m.data) cb(logger, m.data);
        } catch (e) {
          logger.error(e);
        }
      })
    );
