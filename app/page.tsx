"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Character } from '../types';

type Account = {
  authenticated: boolean;
  user?: { id: string; email?: string };
  plan?: 'free' | 'paid' | 'admin';
  generationCredits?: number;
  characterSlots?: number;
};

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then((data) => setAccount(data))
      .catch(() => setAccount({ authenticated: false }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!account?.authenticated) return;
    fetch('/api/characters')
      .then((res) => (res.ok ? res.json() : []))
      .then(setCharacters)
      .catch(() => setCharacters([]));
  }, [account?.authenticated]);

  const handleDelete = async (character: Character) => {
    if (!window.confirm(`Biztosan törlöd ezt a karaktert?\n\n${character.name}`)) return;
    setDeletingId(character.id);
    try {
      const response = await fetch('/api/characters', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: character.id }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'A karakter törlése sikertelen.');
      }
      setCharacters((current) => current.filter((item) => item.id !== character.id));
    } catch (error: any) {
      window.alert(error?.message || 'A karakter törlése sikertelen.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-black text-zinc-100 font-mono p-8">Betöltés…</main>;
  }

  if (!account?.authenticated) {
    return (
      <main className="min-h-screen bg-black text-zinc-100 font-mono flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <div className="text-xs tracking-[0.35em] text-zinc-500 mb-4">V3 IMAGE GENERATOR</div>
          <h1 className="text-3xl font-bold mb-3">Generálj képeket.</h1>
          <p className="text-zinc-400 mb-7">Regisztráció után 6 ingyenes generálással kipróbálhatod a két alapkaraktert.</p>
          <Link href="/auth" className="inline-flex rounded-lg bg-white px-6 py-3 font-semibold text-black hover:bg-zinc-200 transition">Belépés / regisztráció</Link>
        </div>
      </main>
    );
  }

  const isPaid = account.plan === 'paid' || account.plan === 'admin';
  const systemCharacters = characters.filter((character: any) => character.type === 'system');
  const ownCharacters = characters.filter((character: any) => character.type !== 'system');

  return (
    <main className="min-h-screen bg-black text-zinc-100 font-mono flex flex-col items-center max-w-7xl mx-auto px-6 mt-6">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
          <div>
            <div className="text-xs tracking-[0.25em] text-zinc-500 mb-2">IMAGE GENERATOR</div>
            <h1 className="text-3xl font-bold tracking-tight">Karakterek</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-zinc-800 px-3 py-1.5 text-zinc-300">{account.generationCredits ?? 0} kredit</span>
            <span className="rounded-full border border-zinc-800 px-3 py-1.5 text-zinc-500">{isPaid ? 'PAID' : 'FREE'}</span>
            {isPaid && <Link href="/character/new" className="rounded-lg bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200">+ Saját karakter</Link>}
          </div>
        </div>

        <section>
          <h2 className="text-sm uppercase tracking-widest text-zinc-500 mb-4">Alapkarakterek</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemCharacters.map((char) => (
              <Link key={char.id} href={`/character/${char.id}`} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 hover:border-zinc-600 transition">
                <div className="font-bold text-lg">{char.name}</div>
                <div className="text-gray-400 text-sm mt-1 line-clamp-2">{char.description}</div>
                <div className="mt-4 text-xs text-zinc-500">Kép generálása →</div>
              </Link>
            ))}
          </div>
        </section>

        {isPaid && ownCharacters.length > 0 && (
          <section className="mt-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm uppercase tracking-widest text-zinc-500">Saját karakterek</h2>
              <span className="text-xs text-zinc-600">{account.characterSlots ?? 0} hely maradt</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ownCharacters.map((char) => (
                <div key={char.id} className="bg-zinc-900 rounded-lg p-4 border border-gray-800 flex flex-col">
                  <Link href={`/character/${char.id}`} className="block">
                    <div className="font-bold text-lg">{char.name}</div>
                    <div className="text-gray-400 text-sm line-clamp-2">{char.description}</div>
                    <div className="mt-2 text-xs text-gray-500">{char.traits.join(', ')}</div>
                  </Link>
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={() => handleDelete(char)} disabled={deletingId === char.id} className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 transition disabled:opacity-50">
                      {deletingId === char.id ? 'Törlés...' : 'Karakter törlése'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!isPaid && (
          <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400">
            A FREE hozzáférés 6 képgenerálást tartalmaz. Saját karakterekhez és haladó generálási eszközökhöz kreditvásárlás szükséges.
          </div>
        )}
      </div>
    </main>
  );
}
