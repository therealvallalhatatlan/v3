"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Character } from '../types';

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/characters')
      .then((res) => res.json())
      .then(setCharacters)
      .catch(() => setCharacters([]));
  }, []);

  const handleDelete = async (character: Character) => {
    const confirmed = window.confirm(
      `Biztosan törlöd ezt a karaktert?\n\n${character.name}\n\nA karakterhez tartozó referencia- és generált képek, valamint animációk is törlődnek.`
    );
    if (!confirmed) return;

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

  return (
    <main className="min-h-screen bg-black text-zinc-100 font-mono flex flex-col items-center max-w-6xl mx-auto px-4 mt-6">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Karaktereid</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characters.map((char) => (
            <div
              key={char.id}
              className="bg-zinc-900 rounded-lg p-4 shadow hover:shadow-lg transition border border-gray-800 flex flex-col"
            >
              <Link href={`/character/${char.id}`} className="block">
                <div className="flex gap-2 mb-2">
                  {(char.imagePaths || []).slice(0, 1).map((img, i) => (
                    <img key={i} src={img} alt="ref" className="w-32 h-auto object-cover rounded" />
                  ))}
                </div>
                <div className="font-bold text-lg">{char.name}</div>
                <div className="text-gray-400 text-sm line-clamp-2">{char.description}</div>
                <div className="mt-2 text-xs text-gray-500">{char.traits.join(', ')}</div>
              </Link>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(char)}
                  disabled={deletingId === char.id}
                  className="rounded border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === char.id ? 'Törlés...' : 'Karakter törlése'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
