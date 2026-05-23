import { getAllMachines } from "@/lib/machines";
import MachinesClient from "@/components/MachinesClient";
import { SlotType, MakerName } from "@/lib/types";

export default function MachinesPage() {
  const machines = getAllMachines();
  const types = [...new Set(machines.map((m) => m.type))].sort() as SlotType[];
  const makers = [...new Set(machines.map((m) => m.maker))].sort() as MakerName[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">機種一覧</h1>
      </div>
      <MachinesClient machines={machines} types={types} makers={makers} />
    </div>
  );
}
