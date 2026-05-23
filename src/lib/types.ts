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
  | "その他";

export interface SettingData {
  bb: number;
  rb: number;
  at: number;
  machineRatio: number;
}

export interface HyenaData {
  ceiling: number;
  ceilingBonus: number;
  atAvgPayout: number;
  resetOnBonus: boolean;
}

export interface SlotMachine {
  id: string;
  slug: string;
  name: string;
  maker: MakerName;
  releaseDate: string;
  type: SlotType;
  coinRate: number;
  maxBonus: number;
  spinPerHour: number;
  hyena: HyenaData | null;
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

export interface MachineWithEV extends SlotMachine {
  ev: Record<number, number>;
}

export interface HyenaResult {
  currentGame: number;
  expectedSpins: number;
  hitProbability: number;
  ceilingProbability: number;
  ev: number;
  evPositiveGame: number | null;
}
