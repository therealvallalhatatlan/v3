'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCharacterPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      if (!res.ok) throw new Error('Nem sikerült létrehozni a karaktert.');
      router.push('/');
    } catch (e: any) {
      setError(e.message || 'Hiba történt a karakter létrehozásakor.');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex gap-2 mt-2">
            {images.map((img, i) => (
              <span key={i} className="text-xs text-gray-400">{img.name}</span>
            ))}
          </div>
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button type="submit" className="w-full bg-gray-800 py-2 rounded font-semibold hover:bg-gray-700 disabled:opacity-50" disabled={loading}>
          {loading ? 'Létrehozás…' : 'Létrehozás'}
        </button>
      </form>
    </main>
  );
}
