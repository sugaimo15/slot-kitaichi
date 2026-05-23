import { SlotMachine, SettingData, HyenaResult } from "./types";

export function calcEV(
  machine: SlotMachine,
  setting: 1 | 2 | 3 | 4 | 5 | 6
): number {
  const s: SettingData = machine.settings[setting];
  const coinsPerHour = machine.spinPerHour * 3;
  const ev = machine.coinRate * coinsPerHour * ((s.machineRatio / 100) - 1);
  return Math.round(ev);
}

export function calcAllEV(machine: SlotMachine): Record<number, number> {
  const result: Record<number, number> = {};
  for (let s = 1; s <= 6; s++) {
    result[s] = calcEV(machine, s as 1 | 2 | 3 | 4 | 5 | 6);
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

function calcRawEV(
  machine: SlotMachine,
  currentGame: number,
  atProb: number,
  rate: number
): number | null {
  const hyena = machine.hyena;
  if (!hyena) return null;
  const remaining = hyena.ceiling - currentGame;
  if (remaining <= 0) return null;

  const p = 1 / atProb;
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

  return Math.round((expectedCoinsOut - expectedSpins * 3) * rate);
}

export function calcHyenaEV(
  machine: SlotMachine,
  currentGame: number,
  setting: 1 | 2 | 3 | 4 | 5 | 6 | "avg",
  coinRate?: number
): HyenaResult | null {
  const hyena = machine.hyena;
  if (!hyena) return null;

  const rate = coinRate ?? machine.coinRate;
  const remaining = hyena.ceiling - currentGame;
  if (remaining <= 0) return null;

  const atProb = getAtProb(machine, setting);
  if (atProb <= 0) return null;

  const p = 1 / atProb;
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
  const ev = Math.round((expectedCoinsOut - expectedSpins * 3) * rate);

  let evPositiveGame: number | null = null;
  for (let g = 0; g < hyena.ceiling; g++) {
    const raw = calcRawEV(machine, g, atProb, rate);
    if (raw !== null && raw >= 0) {
      evPositiveGame = g;
      break;
    }
  }

  return {
    currentGame,
    expectedSpins: Math.round(expectedSpins),
    hitProbability,
    ceilingProbability,
    ev,
    evPositiveGame,
  };
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
