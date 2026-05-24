import { getAllMachines } from "@/lib/machines";
import MachinesClient from "@/components/MachinesClient";
import { SlotType, MakerName } from "@/lib/types";

export default function HomePage() {
  const machines = getAllMachines();
  const types = [...new Set(machines.map((m) => m.type))].sort() as SlotType[];
  const makers = [...new Set(machines.map((m) => m.maker))].sort() as MakerName[];

  return (
    <div className="space-y-8">
      {/* ヒーロー */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl text-white p-8">
        <h1 className="text-2xl font-bold mb-2">スマスロ 天井・ハイエナ期待値まとめ</h1>
        <p className="text-slate-300 text-sm">
          機種ごとに最適化した天井・ゾーン期待値を掲載。台に表示されたゲーム数から打ち頃かどうかを判定できます。
        </p>
      </section>

      {/* 機種一覧 */}
      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4">機種一覧</h2>
        <MachinesClient machines={machines} types={types} makers={makers} />
      </section>
    </div>
  );
}
