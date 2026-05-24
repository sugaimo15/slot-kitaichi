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
  bb: number;       // BB確率分母（-1: なし）
  rb: number;       // RB確率分母（-1: なし）
  at: number;       // AT/ART確率分母（-1: なし）
  machineRatio: number;  // 機械割 %
}

// 機種のゲームシステム種別。これでページのテンプレートが決まる
export type MachineTemplate = "simple-at" | "multi-ceiling";

export interface ZoneData {
  game: number;       // ゾーン中心ゲーム数
  label?: string;     // 表示ラベル（省略時は「{game}G」）
  hitRate?: number;   // ゾーン内AT当選率（%、例: 15.2）
  note?: string;      // ゾーン種別注記（例: "強ゾーン", "高設定優遇"）
}

export interface HyenaData {
  ceiling: number;        // 天井ゲーム数
  ceilingBonus: number;   // 天井恩恵のネット獲得枚数
  atAvgPayout: number;    // ATのネット平均獲得枚数（AT純増×平均継続G）
  base: number;           // 通常時の50枚あたりゲーム数（ベース）
  resetOnBonus: boolean;  // ボーナス後にゲーム数リセットされるか
  zones?: ZoneData[];     // AT当選しやすいゾーン一覧
}

// 複数天井を持つ機種の、個々の天井定義
export interface CeilingDef {
  id: string;          // 機種内で一意（"at" / "cz" など）
  label: string;       // "AT間天井" など表示名
  game: number;        // 天井到達ゲーム数（通常時）
  resetGame?: number;  // リセット（設定変更）時の天井ゲーム数
  bonus: number;       // 天井到達時の恩恵・ネット期待獲得枚数
  base: number;        // この区間のベース（50枚あたりG）
  atProb: number;      // この区間中の当選確率分母（平均、推定可）
  note?: string;       // 補足（恩恵内容など）
}

export interface SlotMachine {
  id: string;
  slug: string;
  name: string;
  maker: MakerName;
  releaseDate: string;   // "YYYY-MM"
  type: SlotType;
  template?: MachineTemplate; // 未指定時は "simple-at"
  maxBonus: number;      // 最大ボーナス枚数
  spinPerHour: number;   // 時間あたり回転数（デフォルト700）
  hyena: HyenaData | null; // null = ハイエナ非対応（Aタイプ等）
  ceilings?: CeilingDef[]; // multi-ceiling機種の複数天井
  modeInference?: ModeInferenceConfig; // モード推測対応機種のみ
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
  maxCycles: number;   // このモードでの最大周期数（これ以上スルーすると消去）
  baseRate: number;    // AT後の基本移行率 %
  resetRate: number;   // リセット後の基本移行率 %
}

export interface ATTypeInfo {
  id: string;
  label: string;
  tenjokuBoost?: number; // 天国モード率への加算ポイント
}

export interface ModeInferenceConfig {
  modes: ModeInfo[];
  atTypes?: ATTypeInfo[];
  czFailTransition?: number[][];  // [fromMode][toMode] CZスルー後のモード遷移確率行列
  ceilingDistribution?: Record<string, number[]>; // モード別の天井周期振り分け（%、周期1〜N）
  notes?: string;
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
