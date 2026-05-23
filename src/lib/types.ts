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
  bb: number;       // BB確率分母（-1: なし）
  rb: number;       // RB確率分母（-1: なし）
  at: number;       // AT/ART確率分母（-1: なし）
  machineRatio: number;  // 機械割 %
}

export interface SlotMachine {
  id: string;
  slug: string;
  name: string;
  maker: MakerName;
  releaseDate: string;   // "YYYY-MM"
  type: SlotType;
  coinRate: number;      // コイン単価（円）。通常3or4
  maxBonus: number;      // 最大ボーナス枚数
  spinPerHour: number;   // 時間あたり回転数（デフォルト700）
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
  ev: Record<number, number>; // 設定→期待値（円/時間）
}
