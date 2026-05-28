export type SlotType = "AT" | "ART" | "ノーマル" | "Aタイプ";
export type MakerName =
  | "北電子"
  | "サミー"
  | "コナミ"
  | "ユニバーサル"
  | "エレコ"
  | "大都技研"
  | "NET"
  | "オリンピア"
  | "山佐"
  | "三洋"
  | "三共"
  | "その他";

export interface SettingData {
  bb: number;
  rb: number;
  at: number;
  machineRatio: number;
}

export type MachineTemplate = "simple-at" | "multi-ceiling";

export interface ZoneData {
  game: number;
  label?: string;
  hitRate?: number;
  note?: string;
}

export interface HyenaData {
  ceiling: number;
  ceilingBonus: number;
  atAvgPayout: number;
  base: number;
  resetOnBonus: boolean;
  zones?: ZoneData[];
}

export interface CeilingDef {
  id: string;
  label: string;
  game: number;
  resetGame?: number;
  bonus: number;
  base: number;
  atProb: number;
  note?: string;
  gameInputLabel?: string;
}

export interface SlotMachine {
  id: string;
  slug: string;
  name: string;
  maker: MakerName;
  releaseDate: string;
  type: SlotType;
  template?: MachineTemplate;
  maxBonus: number;
  spinPerHour: number;
  hyena: HyenaData | null;
  ceilings?: CeilingDef[];
  modeInference?: ModeInferenceConfig;
  settings: {
    1: SettingData;
    2: SettingData;
    3: SettingData;
    4: SettingData;
    5: SettingData;
    6: SettingData;
  };
  tags: string[];
  description: string;
  featured: boolean;
}

export interface ModeInfo {
  id: string;
  label: string;
  maxCycles: number;
  baseRate: number;
  resetRate: number;
}

export interface ATTypeInfo {
  id: string;
  label: string;
  tenjokuBoost?: number;
}

export interface ModeInferenceConfig {
  modes: ModeInfo[];
  atTypes?: ATTypeInfo[];
  czFailTransition?: number[][];
  ceilingDistribution?: Record<string, number[]>;
  notes?: string;
  hasMagiusMarks?: boolean;
  hasCyclePoints?: boolean;
  cycleUnit?: string;
  prevBonusLabel?: string;
  prevResetLabel?: string;
  czSkipNote?: string;
  bonusSkipLabel?: string;
  bonusSkipNote?: string;
  transitionNote?: string;
  chanceMeiBucketSize?: number;
  modeCeilingGames?: Record<string, number>;
}

export interface MachineWithEV extends SlotMachine {
  ev: Record<number, number>;
}

export interface HyenaResult {
  currentGame: number;
  expectedSpins: number;
  netCoinsPerSpin: number;
  hitProbability: number;
  ceilingProbability: number;
  ev: number;
  evPositiveGame: number | null;
}
