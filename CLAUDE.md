@AGENTS.md

# slot-kitaiti — プロジェクト概要

日本のスマスロ（パチスロ）の**天井期待値計算・内部モード推測ツール**。
Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS で構築し、GitHub Pages に静的出力する。

## 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Next.js 16.2.6（App Router、`output: "export"`で静的ビルド） |
| React | 19.2.4 |
| 言語 | TypeScript |
| スタイル | Tailwind CSS v4 |
| デプロイ先 | GitHub Pages（`sugaimo15/slot-kitaichi` リポジトリ） |
| 開発ブランチ | `claude/brave-thompson-6OO9b` |
| 本番ブランチ | `main`（git push は 127.0.0.1 proxy 経由で 503 になるため、**MCP `mcp__github__push_files` を使ってプッシュする**） |

ビルド確認: `npm run build`（エラーがなければ `✓ Compiled successfully` と表示される）

---

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx                    # トップページ（注目機種一覧）
│   ├── machines/
│   │   ├── page.tsx                # 全機種一覧
│   │   └── [slug]/page.tsx         # 機種詳細ページ（テンプレートへの振り分け）
│   └── ranking/page.tsx            # 機械割ランキング
├── components/
│   ├── EVTable.tsx                 # 設定別スペック表
│   ├── MachineCard.tsx             # 機種カード（一覧用）
│   ├── MachinesClient.tsx          # 機種一覧クライアント
│   ├── ModeInferencePanel.tsx      # 内部モード推測結果パネル（表示のみ、入力なし）
│   └── RankingClient.tsx           # ランキングクライアント
├── templates/
│   ├── SimpleATTemplate.tsx        # 単一天井 AT 機（ハイエナ計算）
│   └── MultiCeilingTemplate.tsx    # 複数天井機（統合入力 + 天井EV + モード推測結果）
├── lib/
│   ├── types.ts                    # 全型定義
│   ├── ev.ts                       # 期待値計算関数群
│   └── machines.ts                 # JSON 読み込み・フィルタ関数
└── data/machines/
    ├── valvrave2.json               # スマスロ革命機ヴァルヴレイヴ2（multi-ceiling, modeInference あり）
    ├── hokuto-no-ken.json           # スマスロ北斗の拳（simple-at）
    ├── god-eater-resurrection.json  # ゴッドイーター（simple-at）
    └── saki-cyoujou.json            # 咲（simple-at）
```

---

## データモデル（`src/lib/types.ts`）

### `SlotMachine`（機種JSONの構造）

```typescript
{
  id: string;           // ファイル名と同じ（例: "valvrave2"）
  slug: string;         // URL パラメータ（id と同じ）
  name: string;         // 表示名（例: "スマスロ革命機ヴァルヴレイヴ2"）
  maker: MakerName;     // "三共" | "サミー" など
  releaseDate: string;  // "YYYY-MM"
  type: SlotType;       // "AT" | "ART" | "ノーマル" | "Aタイプ"
  template?: MachineTemplate; // "simple-at"（デフォルト）| "multi-ceiling"
  maxBonus: number;     // 最大ボーナス枚数（スマスロは 0）
  spinPerHour: number;  // 時間あたり回転数（通常 700）
  hyena: HyenaData | null; // ハイエナ計算用データ（null = 非対応）
  ceilings?: CeilingDef[];  // multi-ceiling 機種のみ
  modeInference?: ModeInferenceConfig; // モード推測対応機種のみ
  settings: { 1〜6: { bb, rb, at, machineRatio } };
  tags: string[];
  description: string;
  featured: boolean;
}
```

### `HyenaData`（simple-at 機種用）

```typescript
{
  ceiling: number;        // 天井ゲーム数
  ceilingBonus: number;   // 天井恩恵の純獲得枚数
  atAvgPayout: number;    // AT の平均純獲得枚数
  base: number;           // ベース（50枚あたりゲーム数）
  resetOnBonus: boolean;  // ボーナス後にリセットされるか
  zones?: ZoneData[];     // AT 当選しやすいゾーン一覧
}
```

### `CeilingDef`（multi-ceiling 機種用・各天井定義）

```typescript
{
  id: string;          // "at" / "cz" など
  label: string;       // "AT間天井" など表示名
  game: number;        // 通常時の天井ゲーム数
  resetGame?: number;  // リセット後の天井ゲーム数（短縮時のみ）
  bonus: number;       // 恩恵の純獲得枚数（推定）
  base: number;        // ベース
  atProb: number;      // 区間内 AT 当選確率分母
  note?: string;       // 補足テキスト
}
```

### `ModeInferenceConfig`（内部モード推測設定）

```typescript
{
  modes: ModeInfo[];                        // モード定義（通常A/B/C・天国など）
  czFailTransition?: number[][];            // CZスルー後のマルコフ遷移行列 [from][to]
  ceilingDistribution?: Record<string, number[]>; // モード別天井周期振り分け（%、周期1〜N）
  notes?: string;                           // 表示用注記
}

// ModeInfo
{
  id: string;        // "tsujoA" / "tsujoB" / "tsujoC" / "tenjoku" など
  label: string;     // "通常A" など
  maxCycles: number; // このモードの最大周期数
  baseRate: number;  // AT後の初期振り分け率 %
  resetRate: number; // リセット後の初期振り分け率 %
}
```

---

## テンプレートシステム

`src/app/machines/[slug]/page.tsx` が `machine.template` の値でテンプレートを選択する。

| template 値 | テンプレート | 対象機種 |
|---|---|---|
| `"simple-at"`（デフォルト） | `SimpleATTemplate` | 北斗の拳・ゴッドイーター・咲 |
| `"multi-ceiling"` | `MultiCeilingTemplate` | ヴァルヴレイヴ2 |

### `SimpleATTemplate`
- 入力: 設定（不明/1〜6）、貸出枚数、現在のゲーム数（スライダー）
- 表示: EV 計算結果、ゾーン別期待値テーブル、設定別スペック

### `MultiCeilingTemplate`
- **統合入力カード**（全状態を親で管理し子コンポーネントへ props で渡す）
  - 貸出枚数、据え置き/リセット（天井EV・モード推測で `isReset` を共有）
  - 現在のゲーム数（AT間）
  - 現在の周期（1〜6）、マギウスマーク点灯数（0〜6）（モード推測対応機種のみ）
  - 現在のポイント（1周期目: 最大200pt、2周期目以降: 最大600pt）
  - CZスルー回数（0〜5+）、決戦ボーナスAT非当選回数（0〜3+）
- **天井別 残りゲーム数・期待値**（各天井の「残りXG」を大きく表示）
- **内部モード推測**（`ModeInferencePanel` コンポーネント）
- **設定別スペック**（`EVTable` コンポーネント）

---

## 主要コンポーネント

### `ModeInferencePanel`（`src/components/ModeInferencePanel.tsx`）

**入力を持たない純粋表示コンポーネント**。全状態は `MultiCeilingTemplate` から props で受け取る。

```typescript
interface Props {
  config: ModeInferenceConfig;
  cyclesSkipped: number;    // CZスルー回数（マルコフ連鎖用）
  kakusenSkipped: number;   // 決戦ボーナスAT非当選回数（マルコフ連鎖用）
  magiusMarks: number;      // マギウスマーク点灯数（天国モード確率増幅用）
  isReset: boolean;         // リセット後か
  currentCycleNum: number;  // 現在の周期番号（天井予測・残りポイント計算用）
  currentPoints: number;    // 現在のポイント（残りポイント計算用）
}
```

**計算ロジック（`useMemo`）**:

1. **`probabilities`（モード確率）**: マルコフ連鎖でモード遷移を反復計算
   - 初期値: `isReset ? resetRate : baseRate` を各モードに設定
   - `totalTransitions = cyclesSkipped + kakusenSkipped` 回だけ遷移行列 `czFailTransition` を適用
   - マギウスマーク ≥4 で天国モード（`maxCycles===1`）の確率を増幅（4個→7倍、5個→10倍、6個→20倍）
   - 正規化して合計100%に

2. **`modeRemainingPts`（前兆当選までの残りポイント）**:
   - `currentCycleNum` 以上の `maxCycles` を持つモードのみ対象
   - 1周期目またはモードが天国（maxCycles=1）の場合: 天井 200pt
   - それ以外（2周期目以降）: 天井 600pt
   - `remaining = maxPt - currentPoints`

3. **`ceilingPrediction`（天井周期予測・ベイズ加重）**:
   - リセット後は最大3周期まで有効（`effectiveMax = isReset ? 3 : 6`）
   - 各周期について `Σ(モード確率 × そのモードの振り分け%)` で加重合算
   - 既経過周期は除外（`slice(currentCycleNum - 1)` で残余を正規化）

**表示セクション**:
1. モード確率バー（確率降順にソート）
2. 推奨コメント（recommendation）
3. モード別解説（最大周期数）
4. 前兆当選までの残りポイント目安（インジゴ背景ボックス）
5. 天井周期予測（モード別カード + 合算予測）

**モードカラー定義**:
```typescript
tenjoku: "bg-yellow-400" / "bg-yellow-100 text-yellow-800 border-yellow-300"
tsujoB:  "bg-blue-400"   / "bg-blue-100 text-blue-800 border-blue-300"
tsujoC:  "bg-green-400"  / "bg-green-100 text-green-800 border-green-300"
tsujoA:  "bg-slate-300"  / "bg-slate-100 text-slate-700 border-slate-300"
```

---

## 期待値計算（`src/lib/ev.ts`）

### `calcCeilingEV(currentGame, ceiling, bonus, base, atProb, exchangeRate)`

単一天井区間の期待値を**切断幾何分布**で計算。`multi-ceiling` テンプレートで各天井ごとに呼ぶ。

- `atProb`: AT当選確率の分母（例: 400 → 1/400）
- `bonus`: 天井到達・自力当選とも同じ枚数を獲得すると仮定
- `1G実質コイン消費 = 50 / base`
- 戻り値: `{ ev, expectedSpins, hitProbability, ceilingProbability, evPositiveGame }`

### `calcHyenaEV(machine, currentGame, setting, exchangeRate)`

simple-at 機種のハイエナ期待値計算。`setting` は `1〜6 | "avg"`。

### `calcZoneEVList(machine, currentGame, exchangeRate)`

ゾーン到達時の期待値リスト（simple-at 用）。

### `evColor(ev: number)`

EV 値に応じた Tailwind クラスを返す:
- `≥3000円`: `"text-red-500 font-bold"`
- `≥1000円`: `"text-orange-500 font-semibold"`
- `≥0円`:    `"text-yellow-600"`
- 負:        `"text-gray-400"`

---

## ヴァルヴレイヴ2 の仕様詳細（`valvrave2.json`）

```json
"modeInference": {
  "modes": [
    { "id": "tsujoA",  "label": "通常A", "maxCycles": 6, "baseRate": 69, "resetRate": 69 },
    { "id": "tsujoB",  "label": "通常B", "maxCycles": 3, "baseRate": 25, "resetRate": 25 },
    { "id": "tsujoC",  "label": "通常C", "maxCycles": 5, "baseRate": 5,  "resetRate": 5  },
    { "id": "tenjoku", "label": "天国",  "maxCycles": 1, "baseRate": 1,  "resetRate": 1  }
  ],
  "czFailTransition": [
    [0.66, 0.29, 0.04, 0.01],  // 通常A → A/B/C/天
    [0.00, 0.66, 0.32, 0.02],  // 通常B → A/B/C/天
    [0.00, 0.00, 0.57, 0.43],  // 通常C → A/B/C/天
    [0.66, 0.31, 0.02, 0.01]   // 天国  → A/B/C/天
  ],
  "ceilingDistribution": {
    "tsujoA":  [14, 29,  4, 15, 13, 23],  // 1〜6周期目の振り分け%
    "tsujoB":  [ 5, 13, 82,  0,  0,  0],
    "tsujoC":  [11, 18, 14, 12, 45,  0],
    "tenjoku": [100, 0,  0,  0,  0,  0]
  }
}
```

**周期の概念（重要）**:
- 周期はポイント天井の単位。1周期 = ポイントが上限に達するまでのゲーム数
- 1周期目の天井: 最大200pt（全モード共通）
- 2周期目以降の天井: 最大600pt（前回600ptなら400pt以下になる場合あり）
- ポイントが天井に達すると「前兆」が発生し、CZ（決戦ZONE）前兆が始まる
- CZに当選するのではなく「CZの**前兆**に当選する」（表現に注意）
- CZスルー回数（`cyclesSkipped`）はマルコフ連鎖の入力であり、現在の周期番号（`currentCycleNum`）とは別概念

**天井**: AT間1500G（リセット後1000G）、CZ間999G。周期天井・決戦ボーナススルー天井は当ツール未対応。

---

## 機種追加の手順

1. `src/data/machines/{slug}.json` を作成（型は `SlotMachine` に準拠）
2. `template` フィールドでテンプレートを指定（省略時は `"simple-at"`）
3. `simple-at` の場合: `hyena` フィールドを設定
4. `multi-ceiling` の場合: `ceilings` 配列を設定、必要なら `modeInference` も追加
5. `featured: true` にするとトップページに表示される
6. ビルド確認: `npm run build`

---

## Git・デプロイワークフロー

```bash
# 通常の開発コミット&プッシュ（feature ブランチへ）
git add <files>
git commit -m "feat: ..."
git push -u origin claude/brave-thompson-6OO9b

# main への反映は MCP ツールを使う（git push は proxy エラーになる）
# mcp__github__push_files で owner="sugaimo15" repo="slot-kitaiti" branch="main" を指定
```

main ブランチ push 後は GitHub Actions で自動的に GitHub Pages へデプロイされる。
