"use client";

import { useState } from "react";
import Link from "next/link";
import { MachineWithEV } from "@/lib/types";
import { evColor, machineRatioColor } from "@/lib/ev";

interface Props {
  machines: MachineWithEV[];
}

export default function RankingClient({ machines }: Props) {
  const [setting, setSetting] = useState<number>(6);

  const ranked = [...machines].sort(
    (a, b) => b.settings[setting as 1|2|3|4|5|6].machineRatio - a.settings[setting as 1|2|3|4|5|6].machineRatio
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <button
            key={s}
            onClick={() => setSetting(s)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              setting === s
                ? "bg-slate-800 text-white border-slate-800"
                : "border-slate-200 text-slate-600 hover:border-slate-400"
            }`}
          >
            設定{s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-slate-500 font-medium w-12">順位</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium">機種名</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden sm:table-cell">メーカー</th>
              <th className="px-4 py-3 text-left text-slate-500 font-medium hidden sm:table-cell">タイプ</th>
              <th className="px-4 py-3 text-center text-slate-500 font-medium">機械割</th>
              <th className="px-4 py-3 text-center text-slate-500 font-medium">期待値/時</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((m, i) => {
              const ratio = m.settings[setting as 1|2|3|4|5|6].machineRatio;
              const ev = m.ev[setting];
              return (
                <tr key={m.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i === 0 ? "bg-yellow-50" : ""}`}>
                  <td className="px-4 py-3 text-center">
                    {i === 0 && <span className="text-yellow-500 font-bold text-lg">1</span>}
                    {i === 1 && <span className="text-slate-400 font-bold">2</span>}
                    {i === 2 && <span className="text-amber-600 font-bold">3</span>}
                    {i > 2 && <span className="text-slate-400">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/machines/${m.slug}`} className="font-medium text-slate-800 hover:text-blue-600">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{m.maker}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{m.type}</span>
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${machineRatioColor(ratio)}`}>
                    {ratio.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${evColor(ev)}`}>
                    {ev >= 0 ? "+" : ""}{ev.toLocaleString()}円
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
