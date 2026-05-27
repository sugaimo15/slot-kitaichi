"use client";

import { useMemo } from "react";
import { ModeInferenceConfig } from "@/lib/types";

interface Props {
  config: ModeInferenceConfig;
  cyclesSkipped: number;
  kakusenSkipped: number;
  magiusMarks: number;
  isReset: boolean;
  currentCycleNum: number;
  currentPoints: number;
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

export default function ModeInferencePanel({
  config,
  cyclesSkipped,
  kakusenSkipped,
  magiusMarks,
  isReset,
  currentCycleNum,
  currentPoints,
}: Props) {
  const totalTransitions = cyclesSkipped + kakusenSkipped;

  const probabilities = useMemo<Record<string, number>>(() => {
    let state = config.modes.map((m) => (isReset ? m.resetRate : m.baseRate) / 100);
    if (config.czFailTransition && totalTransitions > 0) {
      const T = config.czFailTransition;
      for (let iter = 0; iter < totalTransitions; iter++) {
        const next = new Array(state.length).fill(0);
        for (let from = 0; from < state.length; from++) {
          for (let to = 0; to < state.length; to++) {
            next[to] += state[from] * (T[from]?.[to] ?? 0);
          }
        }
        state = next;
      }
    }
    const tenjokuIdx = config.modes.findIndex((m) => m.maxCycles === 1);
    if (tenjokuIdx >= 0 && magiusMarks >= 4) {
      const multiplier = magiusMarks >= 6 ? 20 : magiusMarks >= 5 ? 10 : 7;
      state[tenjokuIdx] *= multiplier;
    }
    const total = state.reduce((a, b) => a + b, 0);
    if (total === 0) return Object.fromEntries(config.modes.map((m) => [m.id, 0]));
    return Object.fromEntries(
      config.modes.map((m, i) => [m.id, Math.round((state[i] / total) * 100)])
    );
  }, [config, totalTransitions, magiusMarks, isReset]);

  const sortedModes = [...config.modes].sort(
    (a, b) => (probabilities[b.id] ?? 0) - (probabilities[a.id] ?? 0)
  );
  const topMode = sortedModes[0];
  const topProb = probabilities[topMode?.id] ?? 0;

  const expectedMaxCycles = useMemo(() => {
    let weighted = 0;
    for (const m of config.modes) {
      const p = (probabilities[m.id] ?? 0) / 100;
      const remaining = Math.max(0, m.maxCycles - (currentCycleNum - 1));
      weighted += p * remaining;
    }
    return Math.round(weighted * 10) / 10;
  }, [probabilities, config.modes, currentCycleNum]);

  const ceilingPrediction = useMemo(() => {
    if (!config.ceilingDistribution) return null;
    const effectiveMax = isReset ? 3 : 6;
    if (currentCycleNum > effectiveMax) return null;
    const results: { cycle: number; prob: number }[] = [];
    for (let cycle = currentCycleNum; cycle <= effectiveMax; cycle++) {
      let weightedProb = 0;
      for (const m of config.modes) {
        const dist = config.ceilingDistribution[m.id];
        if (!dist) continue;
        const modeProb = (probabilities[m.id] ?? 0) / 100;
        const effDist = isReset ? dist.map((v, i) => (i < 3 ? v : 0)) : dist;
        const remainingSum = effDist.slice(currentCycleNum - 1).reduce((a, b) => a + b, 0);
        if (remainingSum > 0) {
          weightedProb += modeProb * ((effDist[cycle - 1] ?? 0) / remainingSum);
        }
      }
      results.push({ cycle, prob: weightedProb });
    }
    const total = results.reduce((a, b) => a + b.prob, 0);
    if (total === 0) return null;
    return results.map((r) => ({ cycle: r.cycle, prob: Math.round((r.prob / total) * 100) }));
  }, [config, probabilities, currentCycleNum, isReset]);

  const modeRemainingPts = useMemo(() => {
    return config.modes
      .filter((m) => m.maxCycles >= currentCycleNum)
      .map((m) => {
        const maxPt = m.maxCycles === 1 || currentCycleNum === 1 ? 200 : 600;
        return {
          id: m.id,
          label: m.label,
          maxPt,
          remaining: Math.max(0, maxPt - currentPoints),
          prob: probabilities[m.id] ?? 0,
        };
      });
  }, [config.modes, currentCycleNum, currentPoints, probabilities]);

  const recommendation = useMemo(() => {
    const tenjokuProb = probabilities[config.modes.find((m) => m.maxCycles === 1)?.id ?? ""] ?? 0;
    const tsujoBProb  = probabilities[config.modes.find((m) => m.maxCycles === 3)?.id ?? ""] ?? 0;
    const tsujoCProb  = probabilities[config.modes.find((m) => m.maxCycles === 5)?.id ?? ""] ?? 0;
    if (tenjokuProb >= 50) return { label: "天国濃厚！最短1周期で当選確定", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200" };
    if (tenjokuProb >= 20) return { label: "天国の可能性あり。早期当選に期待", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
    if (tsujoCProb >= 40) return { label: "通常C濃厚。最大残り数周期でAT確定圏", color: "text-green-700", bg: "bg-green-50 border-green-200" };
    if (tsujoBProb >= 40 && cyclesSkipped >= 1) return { label: "通常B濃厚。早い天井が期待できます", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" };
    if (totalTransitions >= 3) return { label: "通常C・天国への昇格が進んでいる可能性", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" };
    return { label: "通常A中心。標準的な状態です", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" };
  }, [probabilities, config.modes, cyclesSkipped, totalTransitions]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <div>
        <h3 className="font-bold text-slate-800 mb-0.5">内部モード推測</h3>
        <p className="text-xs text-slate-400">
          {totalTransitions > 0
            ? `昇格抽選合計 ${totalTransitions}回（CZスルー ${cyclesSkipped}回 ＋ 決戦ボーナス非当選 ${kakusenSkipped}回）をもとに推測`
            : config.notes}
        </p>
      </div>

      {/* モード推測結果 */}
      <div className="space-y-3">
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
              </div>
            );
          })}
        </div>

        <div className={`rounded-lg border p-3 ${recommendation.bg}`}>
          <div className={`text-sm font-bold ${recommendation.color}`}>{recommendation.label}</div>
          {topMode && topProb > 0 && (
            <div className="text-xs text-slate-500 mt-0.5">
              最有力: <span className="font-medium">{topMode.label}</span>（{topProb}%）
              ／ 期待残り周期 <span className="font-medium">{expectedMaxCycles}</span>周期以内
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
          {config.modes.map((m) => (
            <div key={m.id} className="flex gap-2">
              <span className={`font-medium w-14 shrink-0 ${modeBadge[m.id]?.includes("yellow") ? "text-yellow-700" : modeBadge[m.id]?.includes("blue") ? "text-blue-700" : modeBadge[m.id]?.includes("green") ? "text-green-700" : "text-slate-600"}`}>
                {m.label}
              </span>
              <span>最大 {m.maxCycles} 周期で天井</span>
            </div>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
          <p>※ 確率は公式解析情報をもとにした参考値です。実際の内部モードと異なる場合があります。</p>
          <p>※ マギウスマークは周期前兆中・周期到達時に表示される記号の数です。</p>
          <p>※ CZスルー後の遷移率：通常A→ A:66%/B:29%/C:4%/天:1%、通常B→ B:66%/C:32%/天:2%、通常C→ C:57%/天:43%</p>
        </div>
      </div>

      {/* 前兆当選までの残りポイント */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-2">
        <div className="text-xs font-medium text-indigo-700 mb-2">前兆当選までの残りポイント目安（モード別）</div>
        {modeRemainingPts.map(({ id, label, maxPt, remaining, prob }) => (
          <div key={id} className="flex items-center justify-between gap-2">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded border shrink-0 w-14 text-center ${modeBadge[id] ?? "bg-slate-100 text-slate-600 border-slate-300"}`}>
              {label}
            </span>
            <span className="text-xs text-slate-400 shrink-0">（{prob}%）</span>
            <div className="flex-1 text-right">
              {remaining === 0 ? (
                <span className="text-xs font-bold text-green-600">前兆当選圏内</span>
              ) : (
                <span className="text-xs font-bold text-slate-700">
                  残り最大 <span className="text-indigo-600">{remaining}pt</span>
                  <span className="text-slate-400 font-normal ml-1">（天井{maxPt}pt）</span>
                </span>
              )}
            </div>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 leading-snug pt-1 border-t border-indigo-100">
          ※ 規定ポイント到達で前兆発生。1周期目は全モード最大200pt。天国モードは1周期のみ。
        </p>
      </div>

      {/* 天井周期予測 */}
      {config.ceilingDistribution && (
        <div className="space-y-4">
          <h4 className="text-xs font-medium text-slate-500">天井周期予測</h4>
          <p className="text-[11px] text-slate-400">
            モード別の天井周期振り分けと、モード推測確率で加重した合算予測を表示します。
            {isReset && <span className="text-orange-500 ml-1">リセット後は最大3周期まで有効です。</span>}
          </p>

          <div className="space-y-3">
            {config.modes
              .filter((m) => m.maxCycles >= currentCycleNum)
              .map((m) => {
                const dist = config.ceilingDistribution![m.id];
                if (!dist) return null;
                const modeEffMax = isReset ? Math.min(3, m.maxCycles) : m.maxCycles;
                const effDist = isReset ? dist.map((v, i) => (i < 3 ? v : 0)) : dist;
                const modeProb = probabilities[m.id] ?? 0;
                const cycles = Array.from(
                  { length: modeEffMax - currentCycleNum + 1 },
                  (_, i) => ({ cycle: currentCycleNum + i, pct: effDist[currentCycleNum - 1 + i] ?? 0 })
                );
                return (
                  <div key={m.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border w-14 text-center shrink-0 ${modeBadge[m.id] ?? "bg-slate-100 text-slate-600 border-slate-300"}`}>
                        {m.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        モード確率 <span className="font-bold text-slate-700">{modeProb}%</span>
                        <span className="ml-2">／ 最大{m.maxCycles}周期</span>
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {cycles.map(({ cycle, pct }) => (
                        <div key={cycle} className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-12 shrink-0 text-right">{cycle}周期目</span>
                          <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${pct > 0 ? (modeColors[m.id] ?? "bg-slate-400") : ""}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold w-8 text-right tabular-nums ${pct === 0 ? "text-slate-300" : "text-slate-700"}`}>
                            {pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          {ceilingPrediction && (
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="text-xs font-medium text-slate-500">合算予測（モード確率で加重）</div>
              {ceilingPrediction.map(({ cycle, prob }) => (
                <div key={cycle} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-12 shrink-0 text-right text-slate-600">{cycle}周期目</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all duration-300"
                      style={{ width: `${prob}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-10 text-right tabular-nums ${prob === 0 ? "text-slate-300" : "text-slate-700"}`}>
                    {prob}%
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="text-[11px] text-slate-400 leading-relaxed space-y-0.5">
            <p>※ 天井周期振り分け（公式解析値）：通常A 1〜6周期(14/29/4/15/13/23%)、通常B 1〜3周期(5/13/82%)、通常C 1〜5周期(11/18/14/12/45%)、天国 1周期(100%)</p>
            <p>※ 規定ポイントは1周期目最大200pt、2周期目以降最大600pt（前回600ptなら400pt以下）。</p>
          </div>
        </div>
      )}
    </div>
  );
}
