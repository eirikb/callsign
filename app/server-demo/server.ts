import * as express from "express";
import * as db from "./super-advanced-user-database";
import * as fs from "fs/promises";
import { RegisterUserQuery, UploadKeyQuery } from "./types";

const app = express();

app.use(express.json());

app.post("/demo/registerUser", async (reg, res) => {
  const val = reg.body as RegisterUserQuery;

  const ok = await db.create({
    callsign: val.callsign,
    password: val.password,
    email: "",
  });
  if (ok) {
    return res.json({ status: "created" });
  } else {
    return res.json({ status: "alreadyExists" });
  }
});

app.post("/demo/uploadKey", async (req, res) => {
  const val = req.body as UploadKeyQuery;
  if (await db.verify(val.callsign, val.password)) {
    const callsign = `${val.callsign}.callsign.network`;
    const dir = `./data/keys/${callsign}`;
    await fs.mkdir(dir, { recursive: true });
    const keyPath = `${dir}/${callsign}.key`;
    await fs.writeFile(keyPath, val.publicKey);
    return res.json({ status: "uploaded" });
  } else {
    return res.json({ status: "authError" });
  }
});
app.listen(3002, () => {
  console.log("Demo ready");
});
