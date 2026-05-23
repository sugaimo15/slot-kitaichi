import Link from "next/link";
import { getFeaturedMachines, getRanking } from "@/lib/machines";
import MachineCard from "@/components/MachineCard";
import { evColor, machineRatioColor } from "@/lib/ev";

export default function HomePage() {
  const featured = getFeaturedMachines();
  const ranking = getRanking(6).slice(0, 5);

  return (
    <div className="space-y-10">
      {/* ヒーロー */}
      <section className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl text-white p-8">
        <h1 className="text-2xl font-bold mb-2">パチスロ6号機 期待値まとめ</h1>
        <p className="text-slate-300 text-sm mb-6">
          設定別の期待値・機械割・確率を一覧で確認できます。機種比較やランキングもチェック。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/machines"
            className="bg-yellow-400 text-slate-900 font-bold px-5 py-2 rounded-full text-sm hover:bg-yellow-300 transition-colors"
          >
            機種一覧を見る
          </Link>
          <Link
            href="/ranking"
            className="bg-white/10 text-white px-5 py-2 rounded-full text-sm hover:bg-white/20 transition-colors"
          >
            ランキング
          </Link>
          <Link
            href="/calculator"
            className="bg-white/10 text-white px-5 py-2 rounded-full text-sm hover:bg-white/20 transition-colors"
          >
            期待値計算ツール
          </Link>
        </div>
      </section>

      {/* 注目機種 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">注目機種</h2>
          <Link href="/machines" className="text-sm text-blue-600 hover:underline">すべて見る →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((m) => (
            <MachineCard key={m.id} machine={m} />
          ))}
        </div>
      </section>

      {/* 設定6 機械割 TOP5 */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">設定6 機械割ランキング TOP5</h2>
          <Link href="/ranking" className="text-sm text-blue-600 hover:underline">全ランキング →</Link>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-slate-500 font-medium w-12">順位</th>
                <th className="px-4 py-3 text-left text-slate-500 font-medium">機種名</th>
                <th className="px-4 py-3 text-center text-slate-500 font-medium">機械割</th>
                <th className="px-4 py-3 text-center text-slate-500 font-medium">期待値/時</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((m, i) => (
                <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-center">
                    {i === 0 && <span className="text-yellow-500 font-bold text-base">1</span>}
                    {i === 1 && <span className="text-slate-400 font-bold">2</span>}
                    {i === 2 && <span className="text-amber-600 font-bold">3</span>}
                    {i > 2 && <span className="text-slate-400">{i + 1}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/machines/${m.slug}`} className="font-medium text-slate-800 hover:text-blue-600">
                      {m.name}
                    </Link>
                    <span className="ml-2 text-xs text-slate-400">{m.maker}</span>
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${machineRatioColor(m.settings[6].machineRatio)}`}>
                    {m.settings[6].machineRatio.toFixed(1)}%
                  </td>
                  <td className={`px-4 py-3 text-center font-bold ${evColor(m.ev[6])}`}>
                    {m.ev[6] >= 0 ? "+" : ""}{m.ev[6].toLocaleString()}円
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
