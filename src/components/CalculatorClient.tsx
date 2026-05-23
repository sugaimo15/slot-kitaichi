"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MachineWithEV } from "@/lib/types";
import { machineRatioColor, evColor } from "@/lib/ev";

interface Props {
  machines: MachineWithEV[];
}

export default function CalculatorClient({ machines }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(machines[0]?.slug ?? "");
  const [setting, setSetting] = useState<number>(6);
  const [spins, setSpins] = useState<number>(700);
  const [hours, setHours] = useState<number>(4);
  const [exchangeRate, setExchangeRate] = useState<number>(4.0);

  const machine = useMemo(
    () => machines.find((m) => m.slug === selectedSlug),
    [machines, selectedSlug]
  );

  const result = useMemo(() => {
    if (!machine) return null;
    const s = machine.settings[setting as 1 | 2 | 3 | 4 | 5 | 6];
    const totalSpins = spins * hours;
    const coinsIn = totalSpins * 3;
    const ratio = s.machineRatio / 100;
    const coinsOut = coinsIn * ratio;
    const diff = coinsOut - coinsIn;
    const totalEV = Math.round(diff * exchangeRate);
    const evPerHour = Math.round(totalEV / hours);
    return { totalSpins, coinsIn, coinsOut: Math.round(coinsOut), diff: Math.round(diff), totalEV, evPerHour, ratio: s.machineRatio };
  }, [machine, setting, spins, hours, exchangeRate]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="font-bold text-slate-800">条件を設定</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">機種</label>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {machines.map((m) => (
                <option key={m.id} value={m.slug}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">設定</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <button
                  key={s}
                  onClick={() => setSetting(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    setting === s
                      ? "bg-slate-800 text-white border-slate-800"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              回転数/時間 <span className="font-normal">({spins}回転)</span>
            </label>
            <input
              type="range" min={400} max={1000} step={50}
              value={spins}
              onChange={(e) => setSpins(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>400</span><span>700</span><span>1000</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              プレイ時間 <span className="font-normal">({hours}時間)</span>
            </label>
            <input
              type="range" min={1} max={12} step={1}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>1時間</span><span>6時間</span><span>12時間</span>
            </div>
          </div>

          <div className="sm:col-span-2">
            <div className="flex justify-between items-end mb-1">
              <label className="text-xs font-medium text-slate-500">
                換金率（ホールのコイン単価）
              </label>
              <span className="text-sm font-bold text-slate-700">{exchangeRate.toFixed(1)}円/枚</span>
            </div>
            <input
              type="range" min={2.0} max={5.0} step={0.1}
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
      </div>

      {result && machine && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800">計算結果</h2>
            <Link href={`/machines/${machine.slug}`} className="text-xs text-blue-600 hover:underline">
              {machine.name}の詳細 →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">機械割</div>
              <div className={`text-xl font-bold ${machineRatioColor(result.ratio)}`}>
                {result.ratio.toFixed(1)}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">期待値/時</div>
              <div className={`text-xl font-bold ${evColor(result.evPerHour)}`}>
                {result.evPerHour >= 0 ? "+" : ""}{result.evPerHour.toLocaleString()}円
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">{hours}時間の期待値</div>
              <div className={`text-xl font-bold ${evColor(result.totalEV)}`}>
                {result.totalEV >= 0 ? "+" : ""}{result.totalEV.toLocaleString()}円
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-xs text-slate-400 mb-1">コイン増減</div>
              <div className={`text-xl font-bold ${result.diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                {result.diff >= 0 ? "+" : ""}{result.diff.toLocaleString()}枚
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 space-y-0.5">
            <p>総回転数: {result.totalSpins.toLocaleString()}G ／ 投入: {result.coinsIn.toLocaleString()}枚 ／ 払出: {result.coinsOut.toLocaleString()}枚</p>
            <p>※ 期待値はあくまで理論値です。実際の結果は異なる場合があります。</p>
          </div>
        </div>
      )}
    </div>
  );
}
