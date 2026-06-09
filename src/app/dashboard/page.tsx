export default function ComingSoon() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center space-y-3">
        <p className="font-display text-3xl text-white/20 tracking-widest">COMING SOON</p>
        <p className="font-mono text-xs text-white/20">This module is not part of the demo.</p>
        <a href="/dashboard/dfw" className="inline-block mt-4 font-mono text-xs text-amber-400 border border-amber-400/30 rounded px-4 py-2 hover:bg-amber-400/10 transition-colors">
          ← Back to DFW Demo
        </a>
      </div>
    </div>
  );
}
