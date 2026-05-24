"use client";

import { useState, useMemo } from "react";
import { MachineWithEV } from "@/lib/types";
import { calcCeilingEV, evColor } from "@/lib/ev";
import EVTable from "@/components/EVTable";

interface Props {
  machine: MachineWithEV;
}

export default function MultiCeilingTemplate({ machine }: Props) {
  const ceilings = machine.ceilings ?? [];
  const maxCeiling = Math.max(...ceilings.map((c) => c.game), 1500);

  const [currentGame, setCurrentGame] = useState(Math.floor(maxCeiling * 0.5));
  const [lendCoins, setLendCoins] = useState(46);
  const [reset, setReset] = useState(false);
  const exchangeRate = 1000 / lendCoins;

  const rows = useMemo(() => {
    return ceilings.map((c) => {
      const ceilingGame = reset && c.resetGame ? c.resetGame : c.game;
      const result = calcCeilingEV(
        currentGame,
        ceilingGame,
        c.bonus,
        c.base,
        c.atProb,
        exchangeRate
      );
      return { def: c, ceilingGame, result };
    });
  }, [ceilings, currentGame, exchangeRate, reset]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-bold text-slate-800">天井別の期待値を計算</h2>
        <p className="text-xs text-slate-500">
          本機は複数の天井が独立して存在します。それぞれの天井までの期待値を個別に表示します。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* 状態（通常 / リセット） */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">据え置き / リセット</label>
            <div className="flex gap-2">
              <button
                onClick={() => setReset(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!reset ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                通常（据え置き）
              </button>
              <button
                onClick={() => setReset(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${reset ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                リセット
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">リセット時は天井が短縮されます</p>
          </div>
        </div>

        {/* ゲーム数入力 */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="text-xs font-medium text-slate-500">現在のゲーム数（AT間）</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={maxCeiling}
                value={currentGame}
                onChange={(e) => setCurrentGame(Math.min(Number(e.target.value), maxCeiling))}
                className="w-24 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-500">G</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={maxCeiling}
            step={10}
            value={currentGame}
            onChange={(e) => setCurrentGame(Number(e.target.value))}
            className="w-full accent-blue-600"
          />
        </div>
      </div>

      {/* 天井ごとのEVカード */}
      <div className="grid grid-cols-1 gap-4">
        {rows.map(({ def, ceilingGame, result }) => {
          const reached = currentGame >= ceilingGame;
          return (
            <div key={def.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex justify-between items-start gap-3 mb-3">
                <div>
                  <h3 className="font-bold text-slate-800">{def.label}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    天井 {ceilingGame}G
                    {def.resetGame && reset && <span className="text-orange-500 ml-1">（リセット短縮）</span>}
                    ／ 恩恵 約{def.bonus}枚<span className="text-[10px] ml-0.5">推定</span>
                  </p>
                </div>
                {result && (
                  <div className={`text-right ${result.ev >= 0 ? "" : ""}`}>
                    <div className={`text-2xl font-bold ${evColor(result.ev)}`}>
                      {result.ev >= 0 ? "+" : ""}{result.ev.toLocaleString()}円
                    </div>
                    <div className={`text-xs font-bold ${result.ev >= 0 ? "text-green-700" : "text-red-500"}`}>
                      {result.ev >= 0 ? "▲ EV+" : "▼ EV−"}
                    </div>
                  </div>
                )}
              </div>

              {result ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-lg py-2">
                    <div className="text-[10px] text-slate-400 mb-0.5">当選までの期待G</div>
                    <div className="text-sm font-bold text-slate-700">{result.expectedSpins}G</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg py-2">
                    <div className="text-[10px] text-slate-400 mb-0.5">天井到達率</div>
                    <div className="text-sm font-bold text-slate-700">{(result.ceilingProbability * 100).toFixed(1)}%</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg py-2">
                    <div className="text-[10px] text-slate-400 mb-0.5">EV+になるG数</div>
                    <div className="text-sm font-bold text-green-600">
                      {result.evPositiveGame !== null ? `${result.evPositiveGame}G〜` : "なし"}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  {reached ? "この天井には到達済みです" : "計算できません"}
                </p>
              )}

              {def.note && (
                <p className="text-[11px] text-slate-400 mt-3 leading-snug">{def.note}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
        ※ 周期天井・決戦ボーナススルー天井は当ツール未対応です。各天井の恩恵獲得枚数・区間内当選率は推定値を含むため、実際の値とは異なる場合があります。
      </div>

      {/* 設定別スペック */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">設定別スペック</h2>
        <EVTable machine={machine} />
      </div>
    </div>
  );
}
