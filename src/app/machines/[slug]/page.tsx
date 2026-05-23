import { notFound } from "next/navigation";
import Link from "next/link";
import { getMachineBySlug, getAllMachines } from "@/lib/machines";
import EVTable from "@/components/EVTable";
import { evColor, machineRatioColor } from "@/lib/ev";

export async function generateStaticParams() {
  const machines = getAllMachines();
  return machines.map((m) => ({ slug: m.slug }));
}

export default function MachineDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const machine = getMachineBySlug(params.slug);
  if (!machine) notFound();

  const ev6 = machine.ev[6];
  const ratio6 = machine.settings[6].machineRatio;

  return (
    <div className="space-y-6">
      {/* パンくず */}
      <nav className="text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600">トップ</Link>
        {" / "}
        <Link href="/machines" className="hover:text-slate-600">機種一覧</Link>
        {" / "}
        <span className="text-slate-700">{machine.name}</span>
      </nav>

      {/* ヘッダー */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-slate-100 text-slate-500 rounded px-2 py-0.5">{machine.type}</span>
              <span className="text-xs text-slate-400">{machine.releaseDate.replace("-", "年")}月導入</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{machine.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{machine.maker}</p>
          </div>
          <div className="flex gap-4">
            <div className="text-center bg-slate-50 rounded-xl px-5 py-3">
              <div className="text-xs text-slate-400 mb-0.5">設定6 機械割</div>
              <div className={`text-2xl font-bold ${machineRatioColor(ratio6)}`}>
                {ratio6.toFixed(1)}%
              </div>
            </div>
            <div className="text-center bg-slate-50 rounded-xl px-5 py-3">
              <div className="text-xs text-slate-400 mb-0.5">設定6 期待値/時</div>
              <div className={`text-2xl font-bold ${evColor(ev6)}`}>
                {ev6 >= 0 ? "+" : ""}{ev6.toLocaleString()}円
              </div>
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-sm mt-4">{machine.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {machine.tags.map((tag) => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-600 rounded px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* スペック */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">設定別スペック</h2>
        <EVTable machine={machine} />
      </div>

      {/* 期待値計算ツールへのリンク */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-5 text-center">
        <p className="text-sm text-slate-600 mb-3">
          回転数や時給を細かく計算したいですか？
        </p>
        <Link
          href={`/calculator?machine=${machine.slug}`}
          className="inline-block bg-blue-600 text-white font-semibold px-5 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors"
        >
          期待値計算ツールで試す
        </Link>
      </div>
    </div>
  );
}
