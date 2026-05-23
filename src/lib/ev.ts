import { SlotMachine, SettingData, HyenaResult, ZoneData } from "./types";

export interface ZoneEVResult {
  game: number;
  label: string;
  gamesUntil: number;
  costCoins: number;
  costYen: number;
  ev: number;
  hitRate: number | null;  // ゾーン内AT当選率（%）、null = データなし
}

// 期待値（円/時間）を計算。換金率はユーザー入力（デフォルト4円/枚）
export function calcEV(
  machine: SlotMachine,
  setting: 1 | 2 | 3 | 4 | 5 | 6,
  exchangeRate: number = 4
): number {
  const s: SettingData = machine.settings[setting];
  const coinsPerHour = machine.spinPerHour * 3;
  const ev = exchangeRate * coinsPerHour * ((s.machineRatio / 100) - 1);
  return Math.round(ev);
}

export function calcAllEV(
  machine: SlotMachine,
  exchangeRate: number = 4
): Record<number, number> {
  const result: Record<number, number> = {};
  for (let s = 1; s <= 6; s++) {
    result[s] = calcEV(machine, s as 1 | 2 | 3 | 4 | 5 | 6, exchangeRate);
  }
  return result;
}

function getAtProb(
  machine: SlotMachine,
  setting: 1 | 2 | 3 | 4 | 5 | 6 | "avg"
): number {
  if (setting === "avg") {
    const probs = [1, 2, 3, 4, 5, 6]
      .map((s) => machine.settings[s as 1 | 2 | 3 | 4 | 5 | 6].at)
      .filter((v) => v > 0);
    return probs.reduce((a, b) => a + b, 0) / probs.length;
  }
  return machine.settings[setting].at;
}

// 通常時の1G実質コイン消費 = 50 / ベース
function netCoinsPerSpin(base: number): number {
  return 50 / base;
}

// ハイエナEVの中核計算（再帰なし）
// 投入コストは 50/base（ネット）で計算する
function calcRawHyenaEV(
  machine: SlotMachine,
  currentGame: number,
  atProb: number,
  exchangeRate: number
): number | null {
  const hyena = machine.hyena;
  if (!hyena) return null;
  const remaining = hyena.ceiling - currentGame;
  if (remaining <= 0) return null;

  const p = 1 / atProb;
  const costPerSpin = netCoinsPerSpin(hyena.base);
  let expectedSpins = 0;
  let survivalProb = 1.0;

  for (let k = 1; k <= remaining; k++) {
    expectedSpins += survivalProb * p * k;
    survivalProb *= 1 - p;
  }
  expectedSpins += remaining * survivalProb;

  const hitProbability = 1 - survivalProb;
  const expectedCoinsOut =
    hitProbability * hyena.atAvgPayout + survivalProb * hyena.ceilingBonus;
  const expectedCost = expectedSpins * costPerSpin;

  return Math.round((expectedCoinsOut - expectedCost) * exchangeRate);
}

// ハイエナ期待値（外部公開）
export function calcHyenaEV(
  machine: SlotMachine,
  currentGame: number,
  setting: 1 | 2 | 3 | 4 | 5 | 6 | "avg",
  exchangeRate: number = 4
): HyenaResult | null {
  const hyena = machine.hyena;
  if (!hyena) return null;

  const remaining = hyena.ceiling - currentGame;
  if (remaining <= 0) return null;

  const atProb = getAtProb(machine, setting);
  if (atProb <= 0) return null;

  const p = 1 / atProb;
  const costPerSpin = netCoinsPerSpin(hyena.base);
  let expectedSpins = 0;
  let survivalProb = 1.0;

  for (let k = 1; k <= remaining; k++) {
    expectedSpins += survivalProb * p * k;
    survivalProb *= 1 - p;
  }
  expectedSpins += remaining * survivalProb;

  const ceilingProbability = survivalProb;
  const hitProbability = 1 - ceilingProbability;
  const expectedCoinsOut =
    hitProbability * hyena.atAvgPayout + ceilingProbability * hyena.ceilingBonus;
  const expectedCost = expectedSpins * costPerSpin;
  const ev = Math.round((expectedCoinsOut - expectedCost) * exchangeRate);

  // EV+になる最低ゲーム数を探索（calcRawを直接呼ぶ）
  let evPositiveGame: number | null = null;
  for (let g = 0; g < hyena.ceiling; g++) {
    const raw = calcRawHyenaEV(machine, g, atProb, exchangeRate);
    if (raw !== null && raw >= 0) {
      evPositiveGame = g;
      break;
    }
  }

  return {
    currentGame,
    expectedSpins: Math.round(expectedSpins),
    netCoinsPerSpin: Math.round(costPerSpin * 100) / 100,
    hitProbability,
    ceilingProbability,
    ev,
    evPositiveGame,
  };
}

// ゾーンで当選した場合の期待値を計算（AT発生を仮定した理論値）
export function calcZoneEVList(
  machine: SlotMachine,
  currentGame: number,
  exchangeRate: number
): ZoneEVResult[] {
  const hyena = machine.hyena;
  if (!hyena?.zones) return [];

  const costPerSpin = 50 / hyena.base;

  return hyena.zones
    .filter((z: ZoneData) => z.game > currentGame)
    .map((z: ZoneData) => {
      const gamesUntil = z.game - currentGame;
      const costCoins = Math.round(gamesUntil * costPerSpin);
      const costYen = Math.round(costCoins * exchangeRate);
      const ev = Math.round((hyena.atAvgPayout - costCoins) * exchangeRate);
      return {
        game: z.game,
        label: z.label ?? `${z.game}G`,
        gamesUntil,
        costCoins,
        costYen,
        ev,
        hitRate: z.hitRate ?? null,
      };
    });
}

export function formatProb(denom: number): string {
  if (denom <= 0) return "―";
  return `1/${denom.toLocaleString()}`;
}

export function machineRatioColor(ratio: number): string {
  if (ratio >= 110) return "text-red-500 font-bold";
  if (ratio >= 103) return "text-orange-500 font-semibold";
  if (ratio >= 100) return "text-yellow-600";
  return "text-gray-500";
}

export function evColor(ev: number): string {
  if (ev >= 3000) return "text-red-500 font-bold";
  if (ev >= 1000) return "text-orange-500 font-semibold";
  if (ev >= 0)    return "text-yellow-600";
  return "text-gray-400";
}
