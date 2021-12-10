import { promises as fs } from "fs";
import * as bcrypt from "bcrypt";

interface User {
  callsign: string;
  hash: string;
  email: string;
}

interface CreateUser {
  callsign: string;
  password: string;
  email: string;
}

let saveQueue: Promise<boolean> | undefined;

const data: { [callsign: string]: User } = {};

(async () => {
  try {
    for (const [key, val] of Object.entries(
      JSON.parse(await fs.readFile("./db.json", "utf-8"))
    )) {
      console.log(key, val);
      data[key] = val as User;
    }
  } catch (ignored) {}
})();

export async function verify(
  callsign: string,
  password: string
): Promise<boolean> {
  const user = data[callsign];
  if (!user) return false;
  return bcrypt.compare(password, user.hash);
}

export async function create(user: CreateUser): Promise<boolean> {
  console.log("create!", saveQueue);
  await saveQueue;
  saveQueue = this;
  if (data[user.callsign]) return false;

  data[user.callsign] = {
    callsign: user.callsign,
    hash: await bcrypt.hash(user.password, 10),
    email: user.email,
  };
  // In theory  writing is slower than moving, so if the system
  // is forcefully terminated this might save the day.
  await fs.writeFile("./dbtmp.json", JSON.stringify(data));
  await fs.rename("./dbtmp.json", "./db.json");
  return true;
}
