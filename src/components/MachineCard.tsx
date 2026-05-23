import Link from "next/link";
import { MachineWithEV } from "@/lib/types";
import { evColor, machineRatioColor } from "@/lib/ev";

interface Props {
  machine: MachineWithEV;
}

export default function MachineCard({ machine }: Props) {
  const ev6 = machine.ev[6];
  const ratio6 = machine.settings[6].machineRatio;

  return (
    <Link
      href={`/machines/${machine.slug}`}
      className="block bg-white rounded-xl border border-slate-200 hover:border-yellow-400 hover:shadow-md transition-all p-4"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 text-base leading-tight">{machine.name}</h3>
        <span className="text-xs bg-slate-100 text-slate-500 rounded px-2 py-0.5 ml-2 shrink-0">
          {machine.type}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-3">{machine.maker} / {machine.releaseDate.replace("-", "年")}月</p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div className="text-xs text-slate-400 mb-0.5">設定6 機械割</div>
          <div className={`text-lg font-bold ${machineRatioColor(ratio6)}`}>
            {ratio6.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <div className="text-xs text-slate-400 mb-0.5">設定6 期待値/時</div>
          <div className={`text-lg font-bold ${evColor(ev6)}`}>
            {ev6 >= 0 ? "+" : ""}{ev6.toLocaleString()}円
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mt-3">
        {machine.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
