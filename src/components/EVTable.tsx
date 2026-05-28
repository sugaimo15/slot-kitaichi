import { MachineWithEV } from "@/lib/types";
import { formatProb, machineRatioColor, evColor } from "@/lib/ev";

interface Props {
  machine: MachineWithEV;
}

export default function EVTable({ machine }: Props) {
  const settings = [1, 2, 3, 4, 5, 6] as const;
  const hasCzRate100g = machine.settings[1].czRate100g !== undefined;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-3 py-2 text-left rounded-tl-lg">設定</th>
            {machine.settings[1].bb > 0 && (
              <th className="px-3 py-2 text-center">BB確率</th>
            )}
            {machine.settings[1].rb > 0 && (
              <th className="px-3 py-2 text-center">RB確率</th>
            )}
            {machine.settings[1].at > 0 && (
              <th className="px-3 py-2 text-center">AT確率</th>
            )}
            {hasCzRate100g && (
              <th className="px-3 py-2 text-center">100G内CZ率</th>
            )}
            <th className="px-3 py-2 text-center">機械割</th>
            <th className="px-3 py-2 text-center rounded-tr-lg">期待値/時</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((s) => {
            const d = machine.settings[s];
            const ev = machine.ev[s];
            return (
              <tr
                key={s}
                className={`border-b border-slate-100 ${s === 6 ? "bg-yellow-50" : "hover:bg-slate-50"}`}
              >
                <td className="px-3 py-2.5 font-bold text-slate-700">
                  {s === 6 ? (
                    <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded text-xs font-bold">設定{s}</span>
                  ) : (
                    `設定${s}`
                  )}
                </td>
                {d.bb > 0 && (
                  <td className="px-3 py-2.5 text-center text-slate-600">{formatProb(d.bb)}</td>
                )}
                {d.rb > 0 && (
                  <td className="px-3 py-2.5 text-center text-slate-600">{formatProb(d.rb)}</td>
                )}
                {d.at > 0 && (
                  <td className="px-3 py-2.5 text-center text-slate-600">{formatProb(d.at)}</td>
                )}
                {hasCzRate100g && (
                  <td className={`px-3 py-2.5 text-center font-medium ${
                    d.czRate100g && d.czRate100g >= 30 ? "text-red-500" :
                    d.czRate100g && d.czRate100g >= 25 ? "text-orange-500" :
                    "text-slate-600"
                  }`}>
                    {d.czRate100g !== undefined ? `${d.czRate100g.toFixed(2)}%` : "—"}
                  </td>
                )}
                <td className={`px-3 py-2.5 text-center ${machineRatioColor(d.machineRatio)}`}>
                  {d.machineRatio.toFixed(1)}%
                </td>
                <td className={`px-3 py-2.5 text-center ${evColor(ev)}`}>
                  {ev >= 0 ? "+" : ""}{ev.toLocaleString()}円
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 mt-2">
        ※ 期待値は {machine.spinPerHour}回転/時う46枚貸し・3枚掛けで計算
      </p>
      {hasCzRate100g && (
        <p className="text-xs text-slate-400 mt-1">
          ※ 100G内CZ率は全モード平均の100G＋α以内CZ当選率（公式値）
        </p>
      )}
    </div>
  );
}
