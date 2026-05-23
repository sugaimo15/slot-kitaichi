import { SlotMachine, SettingData } from "./types";

// 期待値（円/時間）を計算
// 機械割から: EV = コイン単価 × 投入コイン数/時間 × (機械割 - 1)
export function calcEV(
  machine: SlotMachine,
  setting: 1 | 2 | 3 | 4 | 5 | 6
): number {
  const s: SettingData = machine.settings[setting];
  const coinsPerHour = machine.spinPerHour * 3; // 3枚掛け
  const ev = machine.coinRate * coinsPerHour * ((s.machineRatio / 100) - 1);
  return Math.round(ev);
}

export function calcAllEV(
  machine: SlotMachine
): Record<number, number> {
  const result: Record<number, number> = {};
  for (let s = 1; s <= 6; s++) {
    result[s] = calcEV(machine, s as 1 | 2 | 3 | 4 | 5 | 6);
  }
  return result;
}

// 確率分母を表示用に変換（-1 は "―"）
export function formatProb(denom: number): string {
  if (denom <= 0) return "―";
  return `1/${denom.toLocaleString()}`;
}

// 機械割を色クラスに変換
export function machineRatioColor(ratio: number): string {
  if (ratio >= 110) return "text-red-500 font-bold";
  if (ratio >= 103) return "text-orange-500 font-semibold";
  if (ratio >= 100) return "text-yellow-600";
  return "text-gray-500";
}

// 期待値を色クラスに変換
export function evColor(ev: number): string {
  if (ev >= 3000) return "text-red-500 font-bold";
  if (ev >= 1000) return "text-orange-500 font-semibold";
  if (ev >= 0)    return "text-yellow-600";
  return "text-gray-400";
}
