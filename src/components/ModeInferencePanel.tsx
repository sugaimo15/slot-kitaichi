"use client";

import { useState, useMemo } from "react";
import { ModeInferenceConfig } from "@/lib/types";

interface Props {
  config: ModeInferenceConfig;
}

const modeColors: Record<string, string> = {
  tenjoku: "bg-yellow-400",
  tsujoB:  "bg-blue-400",
  tsujoC:  "bg-green-400",
  tsujoA:  "bg-slate-300",
};
const modeBadge: Record<string, string> = {
  tenjoku: "bg-yellow-100 text-yellow-800 border-yellow-300",
  tsujoB:  "bg-blue-100  text-blue-800  border-blue-300",
  tsujoC:  "bg-green-100 text-green-800 border-green-300",
  tsujoA:  "bg-slate-100 text-slate-700 border-slate-300",
};

export default function ModeInferencePanel({ config }: Props) {
  const [atTypeId, setAtTypeId]         = useState("unknown");
  const [cyclesSkipped, setCyclesSkipped] = useState(0);
  const [magiusMarks, setMagiusMarks]   = useState(0);
  const [isReset, setIsReset]           = useState(false);

  const probabilities = useMemo<Record<string, number>>(() => {
    const atType = config.atTypes.find((t) => t.id === atTypeId);

    // Base rates
    const raw: Record<string, number> = {};
    for (const m of config.modes) {
      raw[m.id] = isReset ? m.resetRate : m.baseRate;
    }

    // Boost 天国 based on AT type
    const boost = atType?.tenjokuBoost ?? 0;
    if (boost > 0) {
      const tenjokuId = config.modes.find((m) => m.maxCycles === 1)?.id;
      if (tenjokuId && raw[tenjokuId] !== undefined) {
        const share = boost / (config.modes.length - 1);
        raw[tenjokuId] += boost;
        for (const m of config.modes) {
          if (m.id !== tenjokuId) raw[m.id] = Math.max(0, raw[m.id] - share);
        }
      }
    }

    // Boost 天国 based on Magius marks
    const tenjokuId = config.modes.find((m) => m.maxCycles === 1)?.id;
    if (tenjokuId && magiusMarks >= 4) {
      const multiplier = magiusMarks >= 6 ? 20 : magiusMarks >= 5 ? 10 : 7;
      raw[tenjokuId] *= multiplier;
    }

    // Cycle elimination: mode impossible if cyclesSkipped >= maxCycles
    for (const m of config.modes) {
      if (cyclesSkipped >= m.maxCycles) raw[m.id] = 0;
    }

    // Normalize
    const total = Object.values(raw).reduce((a, b) => a + b, 0);
    if (total === 0) return Object.fromEntries(config.modes.map((m) => [m.id, 0]));
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Math.round((v / total) * 100)])
    );
  }, [config, atTypeId, cyclesSkipped, magiusMarks, isReset]);

  const sortedModes = [...config.modes].sort(
    (a, b) => (probabilities[b.id] ?? 0) - (probabilities[a.id] ?? 0)
  );
  const topMode = sortedModes[0];
  const topProb = probabilities[topMode?.id] ?? 0;

  const expectedMaxCycles = useMemo(() => {
    let weighted = 0;
    let totalProb = 0;
    for (const m of config.modes) {
      const p = (probabilities[m.id] ?? 0) / 100;
      const remaining = Math.max(0, m.maxCycles - cyclesSkipped);
      weighted += p * remaining;
      totalProb += p;
    }
    return totalProb > 0 ? Math.round((weighted / totalProb) * 10) / 10 : 0;
  }, [probabilities, config.modes, cyclesSkipped]);

  const recommendation = useMemo(() => {
    const tenjokuProb = probabilities[config.modes.find((m) => m.maxCycles === 1)?.id ?? ""] ?? 0;
    const tsujoB = probabilities[config.modes.find((m) => m.maxCycles === 3)?.id ?? ""] ?? 0;
    if (tenjokuProb >= 50) return { label: "天国濃厚！強力な狙い目", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
    if (tenjokuProb >= 25) return { label: "天国の可能性あり。早期当選に期待", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
    if (tsujoB >= 50 && cyclesSkipped >= 1) return { label: "通常B濃厚。残り最大2周期", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
    if (cyclesSkipped >= 4) return { label: "周期を多く消化。残り天井が近い可能性", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
    return { label: "通常A中心。平均的な状態", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" };
  }, [probabilities, config.modes, cyclesSkipped]);

  const btnBase = "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors";
  const btnActive = "bg-slate-800 text-white border-slate-800";
  const btnInactive = "border-slate-200 text-slate-600 hover:border-slate-400";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <div>
        <h3 className="font-bold text-slate-800 mb-0.5">内部モード推測</h3>
        <p className="text-xs text-slate-400">{config.notes}</p>
      </div>

      {/* 入力エリア */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 前回AT種別 */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-500 mb-1">前回ボーナス／AT種別</label>
          <div className="flex flex-wrap gap-1.5">
            {config.atTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setAtTypeId(t.id)}
                className={`${btnBase} ${atTypeId === t.id ? btnActive : btnInactive}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 周期スルー回数 */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">周期スルー回数</label>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setCyclesSkipped(n)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${cyclesSkipped === n ? btnActive : btnInactive}`}
              >
                {n === 5 ? "5+" : `${n}回`}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">CZ（決戦ZONE）に到達したが当選しなかった回数</p>
        </div>

        {/* マギウスマーク */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">マギウスマーク点灯数</label>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => setMagiusMarks(n)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${magiusMarks === n ? btnActive : btnInactive}`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">4個以上で天国モード濃厚・高設定示唆</p>
        </div>

        {/* リセット */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">機種状態</label>
          <div className="flex gap-2">
            <button
              onClick={() => setIsReset(false)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!isReset ? btnActive : btnInactive}`}
            >
              据え置き
            </button>
            <button
              onClick={() => setIsReset(true)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${isReset ? btnActive : btnInactive}`}
            >
              リセット後
            </button>
          </div>
        </div>
      </div>

      {/* 推測結果 */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-slate-500">モード推測結果</h4>

        {/* 確率バー */}
        <div className="space-y-2">
          {sortedModes.map((m) => {
            const p = probabilities[m.id] ?? 0;
            return (
              <div key={m.id} className="flex items-center gap-2">
                <span className={`text-xs font-medium w-14 shrink-0 px-1.5 py-0.5 rounded border text-center ${modeBadge[m.id] ?? "bg-slate-100 text-slate-600 border-slate-300"}`}>
                  {m.label}
                </span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${modeColors[m.id] ?? "bg-slate-400"}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-10 text-right tabular-nums ${p === 0 ? "text-slate-300" : "text-slate-700"}`}>
                  {p}%
                </span>
                {p === 0 && (
                  <span className="text-[10px] text-slate-300 w-10">除外</span>
                )}
              </div>
            );
          })}
        </div>

        {/* サマリ */}
        <div className={`rounded-lg border p-3 flex items-start gap-3 ${recommendation.bg}`}>
          <div className="flex-1">
            <div className={`text-sm font-bold ${recommendation.color}`}>{recommendation.label}</div>
            {topMode && topProb > 0 && (
              <div className="text-xs text-slate-500 mt-0.5">
                最有力: <span className="font-medium">{topMode.label}</span>（{topProb}%）
                ／ 最大残り周期 <span className="font-medium">{expectedMaxCycles}</span>周期
              </div>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
          <p>※ 確率は公開されている推定移行率をもとにした参考値です。実際の内部モードと異なる場合があります。</p>
          <p>※ マギウスマークは周期前兆中・周期到達時に画面内に表示される記号の数です。</p>
        </div>
      </div>
    </div>
  );
}
