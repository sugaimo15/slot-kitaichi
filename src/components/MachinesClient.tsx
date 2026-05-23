"use client";

import { useState } from "react";
import { MachineWithEV, SlotType, MakerName } from "@/lib/types";
import MachineCard from "./MachineCard";

interface Props {
  machines: MachineWithEV[];
  types: SlotType[];
  makers: MakerName[];
}

type SortKey = "ratio6" | "ev6" | "date" | "name";

export default function MachinesClient({ machines, types }: Props) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("ratio6");

  const filtered = machines
    .filter((m) => !selectedType || m.type === selectedType)
    .sort((a, b) => {
      if (sort === "ratio6") return b.settings[6].machineRatio - a.settings[6].machineRatio;
      if (sort === "ev6")    return b.ev[6] - a.ev[6];
      if (sort === "date")   return b.releaseDate.localeCompare(a.releaseDate);
      if (sort === "name")   return a.name.localeCompare(b.name);
      return 0;
    });

  const btnClass = (active: boolean) =>
    `text-xs px-2.5 py-1 rounded-full border transition-colors ${
      active
        ? "bg-slate-800 text-white border-slate-800"
        : "border-slate-200 text-slate-600 hover:border-slate-400"
    }`;

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">タイプ</span>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setSelectedType("")} className={btnClass(!selectedType)}>すべて</button>
            {types.map((t) => (
              <button key={t} onClick={() => setSelectedType(t)} className={btnClass(selectedType === t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">並び順</span>
          <div className="flex gap-1">
            {([["ratio6", "機械割順"], ["ev6", "期待値順"], ["date", "新着順"]] as [SortKey, string][]).map(([v, label]) => (
              <button key={v} onClick={() => setSort(v)} className={btnClass(sort === v)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-slate-500 text-sm">{filtered.length}件</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((m) => <MachineCard key={m.id} machine={m} />)}
      </div>
      {filtered.length === 0 && (
        <p className="text-slate-400 text-center py-12">条件に一致する機種がありません</p>
      )}
    </div>
  );
}
