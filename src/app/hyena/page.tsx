import { getAllMachines } from "@/lib/machines";
import HyenaCalculator from "@/components/HyenaCalculator";

export default function HyenaPage() {
  const machines = getAllMachines();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ハイエナ・狙い目計算</h1>
        <p className="text-slate-500 text-sm mt-1">
          誰かが辞めた台の現在ゲーム数を入力すると、天井までの期待値を計算します
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-600">
        <p className="font-medium text-blue-800 mb-1">使い方</p>
        <ol className="list-decimal list-inside space-y-1 text-slate-600">
          <li>機種を選択する</li>
          <li>設定が分かれば選択（不明なら「不明」のまま）</li>
          <li>台に表示されているゲーム数を入力する</li>
          <li>期待値がプラスなら打ち頃の台です</li>
        </ol>
      </div>

      <HyenaCalculator machines={machines} />
    </div>
  );
}
