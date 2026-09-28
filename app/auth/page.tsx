'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get('error');
    const message = params.get('message');

    if (callbackError) {
      setError(message || callbackError);
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (error: any) {
      setError(error?.message || 'A Supabase kapcsolat nincs beállítva.');
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get('next');
    const callbackUrl = new URL('/auth/callback', window.location.origin);

    if (next && next.startsWith('/')) {
      callbackUrl.searchParams.set('next', next);
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (error: any) {
      setError(error?.message || 'A Supabase kapcsolat nincs beállítva.');
      setLoading(false);
      return;
    }

    const next = new URLSearchParams(window.location.search).get('next');
    const callbackUrl = new URL('/auth/callback', window.location.origin);

    if (next && next.startsWith('/')) {
      callbackUrl.searchParams.set('next', next);
    }

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 font-mono">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8">
        <div className="text-xs tracking-[0.3em] text-zinc-600 mb-3">V3 IMAGE GENERATOR</div>
        <h1 className="text-3xl font-bold mb-2">Belépés</h1>
        <p className="text-sm text-zinc-500 mb-7">
          Egy mágikus linket küldünk az email címedre. Jelszó nincs.
        </p>

        {sent ? (
          <div className="rounded-xl border border-zinc-800 bg-black p-4 text-sm text-zinc-300">
            Kész. Ellenőrizd az emailjeidet, majd kattints a belépési linkre.
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mb-5 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-50"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M21.35 12.23c0-.72-.06-1.42-.18-2.09H12v3.96h5.25a4.49 4.49 0 0 1-1.95 2.95v2.45h3.15c1.85-1.7 2.9-4.2 2.9-7.27Z"/>
                <path fill="#34A853" d="M12 21.76c2.63 0 4.84-.87 6.45-2.36l-3.15-2.45c-.87.58-1.98.92-3.3.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.74 9.74 0 0 0 12 21.76Z"/>
                <path fill="#FBBC05" d="M6.54 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.27.31-1.84V7.63H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.37l3.25-2.53Z"/>
                <path fill="#EA4335" d="M12 6.13c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.25 14.63 2.24 12 2.24a9.74 9.74 0 0 0-8.71 5.39l3.25 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"/>
              </svg>
              Belépés Google-fiókkal
            </button>

            <div className="mb-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.25em] text-zinc-700">
              <span className="h-px flex-1 bg-zinc-800" />
              <span>vagy emaillel</span>
              <span className="h-px flex-1 bg-zinc-800" />
            </div>

            <label htmlFor="email" className="block text-sm text-zinc-300 mb-2">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-zinc-400"
              placeholder="te@email.hu"
            />

            {error && (
              <div className="mt-3 rounded-xl border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? 'Küldés…' : 'Belépési link küldése'}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
