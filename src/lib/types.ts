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
  | "その他";

export interface SettingData {
  bb: number;       // BB確率分母（-1: なし）
  rb: number;       // RB確率分母（-1: なし）
  at: number;       // AT/ART確率分母（-1: なし）
  machineRatio: number;  // 機械割 %
}

export interface ZoneData {
  game: number;       // ゾーン中心ゲーム数
  label?: string;     // 表示ラベル（省略時は「{game}G」）
  hitRate?: number;   // ゾーン内AT当選率（%、例: 15.2）
}

export interface HyenaData {
  ceiling: number;        // 天井ゲーム数
  ceilingBonus: number;   // 天井恩恵のネット獲得枚数
  atAvgPayout: number;    // ATのネット平均獲得枚数（AT純増×平均継続G）
  base: number;           // 通常時の50枚あたりゲーム数（ベース）
  resetOnBonus: boolean;  // ボーナス後にゲーム数リセットされるか
  zones?: ZoneData[];     // AT当選しやすいゾーン一覧
}

export interface SlotMachine {
  id: string;
  slug: string;
  name: string;
  maker: MakerName;
  releaseDate: string;   // "YYYY-MM"
  type: SlotType;
  maxBonus: number;      // 最大ボーナス枚数
  spinPerHour: number;   // 時間あたり回転数（デフォルト700）
  hyena: HyenaData | null; // null = ハイエナ非対応（Aタイプ等）
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
  ev: Record<number, number>; // 設定→期待値（円/時間）、換金率4円/枚で計算
}

export interface HyenaResult {
  currentGame: number;
  expectedSpins: number;      // 次のATまでの期待回転数
  netCoinsPerSpin: number;    // 通常時の1G実質コイン消費（50/base）
  hitProbability: number;     // 天井前にATを引く確率
  ceilingProbability: number; // 天井に到達する確率
  ev: number;                 // 期待値（円）
  evPositiveGame: number | null; // EV+になるゲーム数（null=常にEV-）
}
