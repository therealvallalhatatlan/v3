"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Character } from '../types';

export default function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    fetch('/api/characters').then((res) => res.json()).then(setCharacters);
  }, []);

  return (
    <main className="min-h-screen bg-black text-zinc-100 font-mono flex flex-col items-center max-w-6xl mx-auto px-4 mt-6">
      <div className="w-full max-w-6xl">
        <div className="flex justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Karaktereid</h1>
          
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characters.map((char) => (
            <Link key={char.id} href={`/character/${char.id}`} className="bg-zinc-900 rounded-lg p-4 shadow hover:shadow-lg transition border border-gray-800 flex flex-col">
              <div className="flex gap-2 mb-2">
                {(char.imagePaths || []).slice(0, 1).map((img, i) => <img key={i} src={img} alt="ref" className="w-32 h-auto object-cover rounded" />)}
              </div>
              <div className="font-bold text-lg">{char.name}</div>
              <div className="text-gray-400 text-sm line-clamp-2">{char.description}</div>
              <div className="mt-2 text-xs text-gray-500">{char.traits.join(', ')}</div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
