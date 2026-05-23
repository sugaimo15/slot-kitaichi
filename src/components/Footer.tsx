export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs mt-auto py-6">
      <div className="max-w-6xl mx-auto px-4 text-center space-y-1">
        <p>当サイトの期待値・機械割データは各種資料をもとにした参考値です。</p>
        <p>実際のゲームは設定や運によって結果が異なります。</p>
        <p className="mt-2">&copy; {new Date().getFullYear()} スロット期待値まとめ</p>
      </div>
    </footer>
  );
}
