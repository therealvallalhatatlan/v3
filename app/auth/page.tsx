'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

export default function AuthPage() {
  const supabase = createSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const callbackError = searchParams.get('error');
    const message = searchParams.get('message');

    if (callbackError) {
      setError(message || callbackError);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const next = searchParams.get('next');
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
