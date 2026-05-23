import { getAllMachines } from "@/lib/machines";
import RankingClient from "@/components/RankingClient";

export default function RankingPage() {
  const machines = getAllMachines();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">機械割ランキング</h1>
        <p className="text-slate-500 text-sm mt-1">設定ボタンで切り替えられます</p>
      </div>
      <RankingClient machines={machines} />
    </div>
  );
}
