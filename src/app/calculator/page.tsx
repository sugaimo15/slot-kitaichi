import { getAllMachines } from "@/lib/machines";
import CalculatorClient from "@/components/CalculatorClient";

export default function CalculatorPage({
  searchParams,
}: {
  searchParams: { machine?: string };
}) {
  const machines = getAllMachines();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">期待値計算ツール</h1>
        <p className="text-slate-500 text-sm mt-1">
          機種・設定・回転数・プレイ時間を入力して期待値を計算します
        </p>
      </div>
      <CalculatorClient machines={machines} initialSlug={searchParams.machine} />
    </div>
  );
}
