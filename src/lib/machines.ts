import fs from "fs";
import path from "path";
import { SlotMachine, MachineWithEV } from "./types";
import { calcAllEV } from "./ev";

const dataDir = path.join(process.cwd(), "src/data/machines");

export function getAllMachines(exchangeRate = 1000 / 46): MachineWithEV[] {
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(dataDir, file), "utf-8");
    const machine: SlotMachine = JSON.parse(raw);
    return { ...machine, ev: calcAllEV(machine, exchangeRate) };
  });
}

export function getMachineBySlug(slug: string): MachineWithEV | null {
  const all = getAllMachines();
  return all.find((m) => m.slug === slug) ?? null;
}

export function getFeaturedMachines(): MachineWithEV[] {
  return getAllMachines().filter((m) => m.featured);
}

export function getRanking(
  setting: 1 | 2 | 3 | 4 | 5 | 6 = 6
): MachineWithEV[] {
  return getAllMachines().sort(
    (a, b) => b.settings[setting].machineRatio - a.settings[setting].machineRatio
  );
}
