"use client";

import { useState, useMemo } from "react";
import { MachineWithEV } from "@/lib/types";
import { calcCeilingEV, evColor } from "@/lib/ev";
import EVTable from "@/components/EVTable";
import ModeInferencePanel from "@/components/ModeInferencePanel";

interface Props {
  machine: MachineWithEV;
}

export default function MultiCeilingTemplate({ machine }: Props) {
  const ceilings = machine.ceilings ?? [];
  const maxCeiling = Math.max(...ceilings.map((c) => c.game), 1500);
  const hasModeInference = !!machine.modeInference;

  // 共通
  const [currentGame, setCurrentGame] = useState(Math.floor(maxCeiling * 0.5));
  const [lendCoins, setLendCoins]     = useState(46);
  const [isReset, setIsReset]         = useState(false);

  // モード推測用
  const [cyclesSkipped, setCyclesSkipped]     = useState(0);
  const [kakusenSkipped, setKakusenSkipped]   = useState(0);
  const [magiusMarks, setMagiusMarks]         = useState(0);
  const [currentCycleNum, setCurrentCycleNum] = useState(1);
  const [currentPoints, setCurrentPoints]     = useState(0);

  const exchangeRate = 1000 / lendCoins;
  const pointsMax = currentCycleNum === 1 ? 200 : 600;

  const rows = useMemo(() => {
    return ceilings.map((c) => {
      const ceilingGame = isReset && c.resetGame ? c.resetGame : c.game;
      const result = calcCeilingEV(currentGame, ceilingGame, c.bonus, c.base, c.atProb, exchangeRate);
      return { def: c, ceilingGame, result };
    });
  }, [ceilings, currentGame, exchangeRate, isReset]);

  const btnBase   = "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors";
  const btnActive = "bg-slate-800 text-white border-slate-800";
  const btnInact  = "border-slate-200 text-slate-600 hover:border-slate-400";

  return (
    <div className="space-y-6">

      {/* ========== 統合入力エリア ========== */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <h2 className="font-bold text-slate-800">現在の状況を入力</h2>
        <p className="text-xs text-slate-500">
          以下を入力すると天井別の期待値とモード推測が更新されます。
        </p>

        {/* 基本設定 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">貸出枚数</label>
            <div className="flex gap-2">
              {[46, 47, 48].map((n) => (
                <button
                  key={n}
                  onClick={() => setLendCoins(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    lendCoins === n ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {n}枚貸し
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">1枚あたり {exchangeRate.toFixed(2)}円</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">据え置き / リセット</label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsReset(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${!isReset ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                通常（据え置き）
              </button>
              <button
                onClick={() => setIsReset(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${isReset ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                リセット
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-1">リセット時は天井短縮・モード移行率が変わります</p>
          </div>
        </div>

        {/* ゲーム数 */}
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

        {/* 周期・ポイント（モード推測対応機種のみ） */}
        {hasModeInference && (
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="text-xs font-semibold text-slate-500">周期・ポイント</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">現在の周期</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6].map((n) => {
                    const disabled = isReset && n > 3;
                    return (
                      <button
                        key={n}
                        onClick={() => { if (!disabled) { setCurrentCycleNum(n); setCurrentPoints(0); } }}
                        disabled={disabled}
                        className={`${btnBase} ${currentCycleNum === n ? btnActive : disabled ? "border-slate-100 text-slate-300 cursor-not-allowed" : btnInact}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1">消化中の周期番号</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">マギウスマーク点灯数</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMagiusMarks(n)}
                      className={`${btnBase} ${magiusMarks === n ? btnActive : btnInact}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">4個以上で天国モード濃厚</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-medium text-slate-500">現在のポイント</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={pointsMax}
                    value={currentPoints}
                    onChange={(e) => setCurrentPoints(Math.min(Math.max(0, Number(e.target.value)), pointsMax))}
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-500">pt</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={pointsMax}
                step={10}
                value={currentPoints}
                onChange={(e) => setCurrentPoints(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                {currentCycleNum === 1 ? "1周期目：最大200pt" : "2周期目以降：最大600pt（前回600ptなら400pt以下）"}
              </p>
            </div>
          </div>
        )}

        {/* CZ・ボーナス履歴（モード推測対応機種のみ） */}
        {hasModeInference && (
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="text-xs font-semibold text-slate-500">CZ・ボーナス履歴（モード推測用）</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">CZスルー回数</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setCyclesSkipped(n)}
                      className={`${btnBase} ${cyclesSkipped === n ? btnActive : btnInact}`}
                    >
                      {n === 5 ? "5+" : n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">決戦ZONEに到達したがAT非当選</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">決戦ボーナスAT非当選</label>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((n) => (
                    <button
                      key={n}
                      onClick={() => setKakusenSkipped(n)}
                      className={`${btnBase} ${kakusenSkipped === n ? btnActive : btnInact}`}
                    >
                      {n === 3 ? "3+" : n}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">決戦ボーナス当選後にAT非当選</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== 天井別 残りゲーム数・期待値 ========== */}
      <div className="space-y-4">
        <h2 className="font-bold text-slate-800 px-1">天井別 残りゲーム数・期待値</h2>
        <div className="grid grid-cols-1 gap-4">
          {rows.map(({ def, ceilingGame, result }) => {
            const reached = currentGame >= ceilingGame;
            const remainingGames = Math.max(0, ceilingGame - currentGame);
            return (
              <div key={def.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{def.label}</h3>
                    {!reached ? (
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-bold text-blue-600">{remainingGames}G</span>
                        <span className="text-xs text-slate-400">で天井到達</span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-orange-500 mt-1 block">天井到達済み</span>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      天井{ceilingGame}G
                      {def.resetGame && isReset && <span className="text-orange-500 ml-1">（リセット短縮）</span>}
                      ／ 恩恵 約{def.bonus}枚<span className="text-[10px] ml-0.5">推定</span>
                    </p>
                  </div>
                  {result && (
                    <div className="text-right shrink-0">
                      <div className={`text-xl font-bold ${evColor(result.ev)}`}>
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
                      <div className="text-[10px] text-slate-400 mb-0.5">当選まで期待G</div>
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
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 leading-relaxed">
        ※ カウンター天井・スルー回数天井など一部の特殊天井は当ツール未対応です。各天井の恩恵獲得枚数・区間内当選率は推定値を含むため、実際の値とは異なる場合があります。
      </div>

      {/* ========== 内部モード推測結果 ========== */}
      {machine.modeInference && (
        <ModeInferencePanel
          config={machine.modeInference}
          cyclesSkipped={cyclesSkipped}
          kakusenSkipped={kakusenSkipped}
          magiusMarks={magiusMarks}
          isReset={isReset}
          currentCycleNum={currentCycleNum}
          currentPoints={currentPoints}
        />
      )}

      {/* 設定別スペック */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">設定別スペック</h2>
        <EVTable machine={machine} />
      </div>
    </div>
  );
}
