"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MachineWithEV } from "@/lib/types";
import { calcHyenaEV, evColor } from "@/lib/ev";

interface Props {
  machines: MachineWithEV[];
}

type SettingOption = 1 | 2 | 3 | 4 | 5 | 6 | "avg";

export default function HyenaCalculator({ machines }: Props) {
  const hyenaMachines = machines.filter((m) => m.hyena !== null);

  const [selectedSlug, setSelectedSlug] = useState(hyenaMachines[0]?.slug ?? "");
  const [setting, setSetting] = useState<SettingOption>("avg");
  const [currentGame, setCurrentGame] = useState(600);
  const [exchangeRate, setExchangeRate] = useState(4.0);

  const machine = useMemo(
    () => hyenaMachines.find((m) => m.slug === selectedSlug),
    [hyenaMachines, selectedSlug]
  );

  const result = useMemo(() => {
    if (!machine) return null;
    return calcHyenaEV(machine, currentGame, setting, exchangeRate);
  }, [machine, currentGame, setting, exchangeRate]);

  const evPositiveGame = result?.evPositiveGame;
  const ceiling = machine?.hyena?.ceiling ?? 1000;
  const base = machine?.hyena?.base ?? 50;
  const progressPct = Math.min((currentGame / ceiling) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-bold text-slate-800">条件を入力</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 機種選択 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">機種</label>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {hyenaMachines.map((m) => (
                <option key={m.id} value={m.slug}>{m.name}</option>
              ))}
            </select>
            {machine?.hyena && (
              <div className="mt-1.5 flex gap-3 text-xs text-slate-400">
                <span>天井 {machine.hyena.ceiling}G</span>
                <span>ベース {machine.hyena.base}G/50枚</span>
                <span>1G実質 {(50 / machine.hyena.base).toFixed(2)}枚</span>
              </div>
            )}
          </div>

          {/* 設定 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">設定</label>
            <div className="flex gap-1">
              <button
                onClick={() => setSetting("avg")}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${setting === "avg" ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                不明
              </button>
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <button
                  key={s}
                  onClick={() => setSetting(s as SettingOption)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${setting === s ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {setting === "avg" && (
              <p className="text-xs text-slate-400 mt-1">設定1〜6の平均AT確率で計算します</p>
            )}
          </div>

          {/* 換金率 */}
          <div className="sm:col-span-2">
            <div className="flex justify-between items-end mb-1">
              <label className="text-xs font-medium text-slate-500">
                換金率（ホールのコイン単価）
              </label>
              <span className="text-sm font-bold text-slate-700">{exchangeRate.toFixed(1)}円/枚</span>
            </div>
            <input
              type="range"
              min={2.0}
              max={5.0}
              step={0.1}
              value={exchangeRate}
              onChange={(e) => setExchangeRate(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>2円（低換金）</span>
              <span>4円（等価）</span>
              <span>5円</span>
            </div>
          </div>
        </div>

        {/* ゲーム数入力 */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="text-xs font-medium text-slate-500">現在のゲーム数</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={ceiling}
                value={currentGame}
                onChange={(e) => setCurrentGame(Math.min(Number(e.target.value), ceiling - 1))}
                className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-500">G</span>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={ceiling - 1}
            step={10}
            value={currentGame}
            onChange={(e) => setCurrentGame(Number(e.target.value))}
            className="w-full accent-blue-600"
          />

          <div className="mt-2 relative h-5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPct >= 80 ? "bg-red-500" : progressPct >= 50 ? "bg-orange-400" : "bg-blue-400"}`}
              style={{ width: `${progressPct}%` }}
            />
            {evPositiveGame !== null && evPositiveGame !== undefined && (
              <div
                className="absolute top-0 h-full w-0.5 bg-green-500"
                style={{ left: `${(evPositiveGame / ceiling) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0G</span>
            {evPositiveGame !== null && evPositiveGame !== undefined && (
              <span className="text-green-600 font-medium">EV+ {evPositiveGame}G〜</span>
            )}
            <span>天井 {ceiling}G</span>
          </div>
        </div>
      </div>

      {result && machine && (
        <div className="space-y-4">
          <div className={`rounded-xl p-5 text-center ${result.ev >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className={`text-4xl font-bold mb-1 ${evColor(result.ev)}`}>
              {result.ev >= 0 ? "+" : ""}{result.ev.toLocaleString()}円
            </div>
            <div className="text-sm text-slate-600">
              {currentGame}Gから天井まで打った場合の期待値
            </div>
            <div className={`mt-2 text-sm font-bold ${result.ev >= 0 ? "text-green-700" : "text-red-600"}`}>
              {result.ev >= 0 ? "▲ EV+　打ち頃の台です" : "▼ EV−　期待値マイナスの台です"}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">次ATまでの期待G数</div>
              <div className="text-xl font-bold text-slate-700">{result.expectedSpins}G</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">1G実質消費</div>
              <div className="text-xl font-bold text-slate-700">
                {result.netCoinsPerSpin}枚
              </div>
              <div className="text-xs text-slate-400">50÷{base}G</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">天井前AT確率</div>
              <div className="text-xl font-bold text-blue-600">
                {(result.hitProbability * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">EV+になるG数</div>
              <div className="text-xl font-bold text-green-600">
                {result.evPositiveGame !== null ? `${result.evPositiveGame}G〜` : "なし"}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="font-medium text-slate-700">{machine.name}</span>
              <div>天井{machine.hyena?.ceiling}G ／ ベース{machine.hyena?.base}G/50枚 ／ AT平均純増{machine.hyena?.atAvgPayout}枚 ／ 天井恩恵{machine.hyena?.ceilingBonus}枚</div>
            </div>
            <Link href={`/machines/${machine.slug}`} className="text-blue-600 hover:underline shrink-0 ml-4">
              詳細 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
