import { promises as fs } from "fs";

interface Entity {
  callsign: string;
  password: string;
  email: string;
}

let saveQueue: Promise<boolean> | undefined;

const data: { [callsign: string]: Entity } = {};

(async () => {
  try {
    for (const [key, val] of Object.entries(
      JSON.parse(await fs.readFile("./db.json", "utf-8"))
    )) {
      console.log(key, val);
      data[key] = val as Entity;
    }
  } catch (ignored) {}
})();

export function get(callsign: string): Entity | undefined {
  return data[callsign];
}

export async function set(entity: Entity) {
  console.log("set!", saveQueue);
  await saveQueue;
  saveQueue = this;
  if (data[entity.callsign]) return false;

  data[entity.callsign] = entity;
  // In theory  writing is slower than moving, so if the system
  // is forcefully terminated this might save the day.
  await fs.writeFile("./dbtmp.json", JSON.stringify(data));
  await fs.rename("./dbtmp.json", "./db.json");
  return true;
}
