'use client';

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black"
      role="status"
      aria-label="Betöltés"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-zinc-800" />
        <div
          className="absolute inset-2 rounded-full border border-zinc-700 border-t-zinc-200"
          style={{ animation: 'v-loader-spin 1.1s linear infinite' }}
        />
        <div
          className="absolute inset-6 rounded-full border border-zinc-800 border-b-zinc-400"
          style={{ animation: 'v-loader-spin-reverse 1.7s linear infinite' }}
        />
        <div className="h-2.5 w-2.5 rounded-full bg-zinc-100 shadow-[0_0_22px_rgba(255,255,255,0.35)]" />
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[9px] font-semibold uppercase tracking-[0.35em] text-zinc-700">
        VALÓSÁG MOTOR
      </div>

      <style jsx>{`
        @keyframes v-loader-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes v-loader-spin-reverse {
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
