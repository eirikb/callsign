import * as express from "express";
import * as db from "./super-advanced-user-database";
// import * as fs from "fs/promises";
import * as https from "https";
import {
  RegisterUserQuery,
  RegisterUserReply,
  // UploadKeyQuery,
  // UploadKeyReply,
} from "./types";

const app = express();

app.use(express.json());

// const listeners: { [key: string]: any[] } = {};
//
// const actions: { [key: string]: any } = {
// };

// wsServer.on("connection", (socket) => {
//   console.log("connection!");
//   console.log(socket);
//
//   socket.on("message", async (message: any) => {
//     const d = JSON.parse(message);
//     console.log(">", d);
//     const action: any = actions[d.type];
//     try {
//       if (action) {
//         const res = await action(d, socket);
//         if (res) {
//           send(socket, Object.assign({ type: "reply" }, res));
//         }
//       } else {
//         console.log("Unknown action", action, d);
//         send(socket, {
//           error: `Unknown action ${d.type}`,
//           type: "reply",
//         });
//       }
//     } catch (e) {
//       send(socket, { error: e.message, type: "reply" });
//     }
//   });
//
//   socket.on("close", () => {
//     console.log("CLOSE!...");
//     const listenerList = listeners[(socket as any).callsign];
//     if (listenerList) {
//       const index = listenerList.indexOf(socket);
//       console.log("index", index);
//       console.log("before", listenerList.length);
//       listenerList.splice(index, 1);
//       console.log("after", listenerList.length);
//     }
//   });
// });

app.post("registerUser", async (reg): Promise<RegisterUserReply> => {
  const val = reg.body as RegisterUserQuery;

  const ok = await db.create({
    callsign: val.callsign,
    password: val.password,
    email: "",
  });
  if (ok) {
    // Trigger server to create https cert. Fire and forget.
    await https.get(`https://${val.callsign}.callsign.network`);
    return { status: "created" };
  } else {
    return { status: "alreadyExists" };
  }
});

// async uploadKey(val: UploadKeyQuery): Promise<UploadKeyReply> {
//   if (await db.verify(val.callsign, val.password)) {
//     const callsign = `${val.callsign}.callsign.network`;
//     const dir = `./data/keys/${callsign}`;
//     await fs.mkdir(dir, { recursive: true });
//     const keyPath = `${dir}/${callsign}.key`;
//     await fs.writeFile(keyPath, val.publicKey);
//     return { status: "uploaded" };
//   } else {
//     return { status: "authError" };
//   }
// },
app.listen(3002, () => {
  console.log("Demo ready");
});
