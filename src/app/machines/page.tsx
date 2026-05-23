import { getAllMachines } from "@/lib/machines";
import MachineCard from "@/components/MachineCard";
import { MachineWithEV, SlotType, MakerName } from "@/lib/types";

interface SearchParams {
  type?: string;
  maker?: string;
  sort?: string;
}

function filterAndSort(
  machines: MachineWithEV[],
  params: SearchParams
): MachineWithEV[] {
  let result = [...machines];
  if (params.type) result = result.filter((m) => m.type === params.type);
  if (params.maker) result = result.filter((m) => m.maker === params.maker);

  const sort = params.sort ?? "ratio6";
  if (sort === "ratio6") result.sort((a, b) => b.settings[6].machineRatio - a.settings[6].machineRatio);
  if (sort === "ev6")    result.sort((a, b) => b.ev[6] - a.ev[6]);
  if (sort === "name")   result.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "date")   result.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  return result;
}

export default function MachinesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const all = getAllMachines();
  const machines = filterAndSort(all, searchParams);

  const types: SlotType[] = ["AT", "ART", "ノーマル", "Aタイプ"];
  const makers: MakerName[] = [...new Set(all.map((m) => m.maker))].sort() as MakerName[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">機種一覧</h1>
        <p className="text-slate-500 text-sm mt-1">{machines.length}件</p>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">タイプ</label>
          <div className="flex gap-1 flex-wrap">
            <a
              href="/machines"
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${!searchParams.type ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
            >
              すべて
            </a>
            {types.map((t) => (
              <a
                key={t}
                href={`/machines?type=${t}${searchParams.maker ? `&maker=${searchParams.maker}` : ""}${searchParams.sort ? `&sort=${searchParams.sort}` : ""}`}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${searchParams.type === t ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                {t}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500">並び順</label>
          <div className="flex gap-1">
            {[
              { v: "ratio6", label: "機械割順" },
              { v: "ev6",    label: "期待値順" },
              { v: "date",   label: "新着順" },
            ].map(({ v, label }) => (
              <a
                key={v}
                href={`/machines?${searchParams.type ? `type=${searchParams.type}&` : ""}sort=${v}`}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${(searchParams.sort ?? "ratio6") === v ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:border-slate-400"}`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 一覧 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.map((m) => (
          <MachineCard key={m.id} machine={m} />
        ))}
      </div>
      {machines.length === 0 && (
        <p className="text-slate-400 text-center py-12">条件に一致する機種がありません</p>
      )}
    </div>
  );
}
