"use client";

import { useState, useMemo } from "react";
import { MachineWithEV } from "@/lib/types";
import { calcHyenaEV, calcZoneEVList, evColor } from "@/lib/ev";
import EVTable from "@/components/EVTable";

interface Props {
  machine: MachineWithEV;
}

type SettingOption = 1 | 2 | 3 | 4 | 5 | 6 | "avg";

export default function SimpleATTemplate({ machine }: Props) {
  const hyena = machine.hyena;
  const ceiling = hyena?.ceiling ?? 1000;
  const base = hyena?.base ?? 50;

  const [setting, setSetting] = useState<SettingOption>("avg");
  const [currentGame, setCurrentGame] = useState(Math.floor(ceiling * 0.6));
  const [lendCoins, setLendCoins] = useState(46);
  const exchangeRate = 1000 / lendCoins;

  const result = useMemo(
    () => calcHyenaEV(machine, currentGame, setting, exchangeRate),
    [machine, currentGame, setting, exchangeRate]
  );

  const zoneEVs = useMemo(
    () => calcZoneEVList(machine, currentGame, exchangeRate),
    [machine, currentGame, exchangeRate]
  );

  const evPositiveGame = result?.evPositiveGame;
  const progressPct = Math.min((currentGame / ceiling) * 100, 100);
  const zones = hyena?.zones ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-bold text-slate-800">ハイエナ期待値を計算</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* 貸出枚数 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">貸出枚数</label>
            <div className="flex gap-2">
              {[46, 47, 48].map((n) => (
                <button
                  key={n}
                  onClick={() => setLendCoins(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    lendCoins === n
                      ? "bg-slate-800 text-white border-slate-800"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {n}枚貸し
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">1枚あたり {exchangeRate.toFixed(2)}円</p>
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

          {/* プログレスバー（ゾーン・EV+マーカー付き） */}
          <div className="mt-2">
            <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
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
              {zones.map((z) => (
                <div
                  key={z.game}
                  className="absolute top-0 h-full w-0.5 bg-yellow-400 opacity-90"
                  style={{ left: `${(z.game / ceiling) * 100}%` }}
                />
              ))}
            </div>
            {zones.length > 0 && (
              <div className="relative h-4 mt-0.5">
                {zones.map((z) => (
                  <span
                    key={z.game}
                    className="absolute text-[10px] text-yellow-600 font-medium -translate-x-1/2 leading-none"
                    style={{ left: `${(z.game / ceiling) * 100}%` }}
                  >
                    {z.game}
                  </span>
                ))}
              </div>
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

      {result && (
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
              <div className="text-xl font-bold text-slate-700">{result.netCoinsPerSpin}枚</div>
              <div className="text-xs text-slate-400">50÷{base}G</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">天井前AT確率</div>
              <div className="text-xl font-bold text-blue-600">{(result.hitProbability * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">EV+になるG数</div>
              <div className="text-xl font-bold text-green-600">
                {result.evPositiveGame !== null ? `${result.evPositiveGame}G〜` : "なし"}
              </div>
            </div>
          </div>

          {/* ゾーン当選時EV */}
          {zoneEVs.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-400" />
                ゾーン当選時の期待値
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100">
                      <th className="text-left py-1.5 font-medium">ゾーン</th>
                      <th className="text-right py-1.5 font-medium">残りG</th>
                      <th className="text-right py-1.5 font-medium">当選率</th>
                      <th className="text-right py-1.5 font-medium">到達コスト</th>
                      <th className="text-right py-1.5 font-medium">当選時EV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {zoneEVs.map((z) => (
                      <tr key={z.game} className="border-b border-slate-50 last:border-0">
                        <td className="py-2">
                          <span className="font-medium text-slate-700">{z.label}</span>
                          {z.note && (
                            <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{z.note}</div>
                          )}
                        </td>
                        <td className="py-2 text-right text-slate-500">{z.gamesUntil}G</td>
                        <td className="py-2 text-right">
                          {z.hitRate !== null
                            ? <span className="font-medium text-blue-600">{z.hitRate.toFixed(1)}%<span className="text-[10px] text-slate-400 ml-0.5">推定</span></span>
                            : <span className="text-slate-300">―</span>
                          }
                        </td>
                        <td className="py-2 text-right text-slate-500">
                          −{z.costYen.toLocaleString()}円
                          <span className="text-xs text-slate-400 ml-1">({z.costCoins}枚)</span>
                        </td>
                        <td className={`py-2 text-right font-bold ${evColor(z.ev)}`}>
                          {z.ev >= 0 ? "+" : ""}{z.ev.toLocaleString()}円
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                <p>※ ゾーン当選時EVはATが発生した場合の理論値（AT平均純増{hyena?.atAvgPayout}枚を想定）</p>
                <p>※ 当選率は推定値です。実際の値とは異なる場合があります。</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 設定別スペック */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">設定別スペック</h2>
        <EVTable machine={machine} />
      </div>
    </div>
  );
}
