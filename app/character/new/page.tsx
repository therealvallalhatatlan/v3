'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Account = {
  authenticated: boolean;
  plan?: 'free' | 'paid' | 'admin';
  generationCredits?: number;
  characterSlots?: number;
};

export default function CreateCharacterPage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then(setAccount)
      .catch(() => setAccount({ authenticated: false }));
  }, []);

  const isPaid = account?.plan === 'paid' || account?.plan === 'admin';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImages(Array.from(e.target.files).slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const imageUrls = await Promise.all(
        images.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          traits: traits.split(',').map((t) => t.trim()).filter(Boolean),
          imageUrls,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Nem sikerült létrehozni a karaktert.');

      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Hiba történt a karakter létrehozásakor.');
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return <main className="min-h-screen bg-black text-gray-100 flex items-center justify-center font-mono">Betöltés…</main>;
  }

  if (!account.authenticated) {
    router.replace('/auth');
    return <main className="min-h-screen bg-black text-gray-100 flex items-center justify-center font-mono">Átirányítás…</main>;
  }

  if (!isPaid) {
    return (
      <main className="min-h-screen bg-black text-gray-100 font-mono flex items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-zinc-950 p-8 text-center">
          <div className="text-xs tracking-[0.3em] text-gray-500 mb-4">HALADÓ FUNKCIÓ</div>
          <h1 className="text-2xl font-bold mb-3">Saját karakter létrehozása</h1>
          <p className="text-sm text-gray-400">
            Saját karakterhez és a haladó generálási eszközökhöz kreditvásárlás szükséges.
          </p>
          <button type="button" onClick={() => router.push('/')} className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black">
            Vissza a karakterekhez
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-gray-100 font-mono flex flex-col items-center p-8">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-lg shadow max-w-md w-full border border-gray-800">
        <h2 className="text-2xl font-bold mb-6">Karakter létrehozása</h2>

        <div className="mb-4">
          <label className="block mb-1">Név</label>
          <input className="w-full p-2 rounded bg-gray-800 border border-gray-700" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Leírás</label>
          <textarea className="w-full p-2 rounded bg-gray-800 border border-gray-700" value={description} onChange={e => setDescription(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Jellemzők <span className="text-gray-500">(vesszővel elválasztva)</span></label>
          <input className="w-full p-2 rounded bg-gray-800 border border-gray-700" value={traits} onChange={e => setTraits(e.target.value)} required />
        </div>

        <div className="mb-4">
          <label className="block mb-1">Referenciaképek <span className="text-gray-500">(1–5)</span></label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} required className="w-full" />
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((img, i) => <span key={i} className="text-xs text-gray-400">{img.name}</span>)}
          </div>
        </div>

        {typeof account.characterSlots === 'number' && (
          <div className="mb-4 text-xs text-gray-500">Szabad karakterhely: {account.characterSlots}</div>
        )}

        {error && <div className="text-red-500 mb-2">{error}</div>}

        <button type="submit" className="w-full bg-gray-800 py-2 rounded font-semibold hover:bg-gray-700 disabled:opacity-50" disabled={loading || (account.characterSlots ?? 0) < 1}>
          {loading ? 'Létrehozás…' : (account.characterSlots ?? 0) < 1 ? 'Nincs szabad karakterhely' : 'Létrehozás'}
        </button>
      </form>
    </main>
  );
}
