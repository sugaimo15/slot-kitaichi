import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight hover:text-yellow-400 transition-colors">
          スロット期待値まとめ
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          <Link href="/machines" className="hover:text-yellow-400 transition-colors">機種一覧</Link>
          <Link href="/ranking" className="hover:text-yellow-400 transition-colors">ランキング</Link>
        </nav>
      </div>
    </header>
  );
}
