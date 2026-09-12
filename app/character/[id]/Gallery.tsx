import React, { useEffect, useState } from 'react';

interface ImageInfo {
  filename: string;
  url: string;
  created: number;
  meta?: {
    characterId?: string;
    characterIds?: string[];
    duoKey?: string;
    aliasMap?: Record<string, string>;
    style?: string;
    styleIntensity?: number;
    camera?: string;
    aspectRatio?: 'landscape-16-9' | 'portrait-9-16';
    location?: string;
    mood?: string;
    locationProfileId?: string;
    locationFingerprint?: string;
    shotTemplateId?: string;
    continuityNotes?: string;
    variant?: 'single' | 'A' | 'B';
  } | null;
}

interface Props {
  characterId: string;
  onUseForAnimation?: (url: string) => void;
}

export default function Gallery({ characterId, onUseForAnimation }: Props) {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 12;
  const totalPages = Math.max(1, Math.ceil(images.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageImages = images.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    fetch(`/api/generated/${characterId}/list`)
      .then(res => res.json())
      .then(data => setImages(data.images || []))
      .finally(() => setLoading(false));
  }, [characterId]);

  useEffect(() => setCurrentPage(1), [characterId]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedIndex(null);
        return;
      }
      if (selectedIndex === null || images.length === 0) return;
      if (event.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length));
        return;
      }
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev === null ? 0 : (prev - 1 + images.length) % images.length));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex, images.length]);

  const selectedImage = selectedIndex === null ? null : images[selectedIndex] ?? null;

  if (loading) return <div>Galéria betöltése...</div>;
  if (!images.length) return <div className="text-gray-500">Még nincs generált kép.</div>;

  return (
    <>
      <div className="flex items-center justify-between mt-4 mb-2 text-xs text-gray-400">
        <div>{currentPage}. oldal / {totalPages}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage <= 1} className="px-2 py-1 rounded border border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500">Előző</button>
          <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages} className="px-2 py-1 rounded border border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500">Következő</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        {pageImages.map((img, index) => (
          <div key={img.filename} className="bg-gray-800 rounded shadow p-2 flex flex-col items-center">
            <button type="button" onClick={() => setSelectedIndex(pageStart + index)} className="w-full focus:outline-none focus:ring-2 focus:ring-gray-300 rounded" aria-label="Kép előnézetének megnyitása">
              <img src={img.url} alt={img.filename} className="rounded mb-2 max-h-48 object-contain w-full" />
            </button>
            <div className="text-xs text-gray-400 mb-1">{new Date(img.created).toLocaleString('hu-HU')}</div>
            {img.meta?.style && <div className="text-[11px] text-gray-300 mb-1">Stílus: {img.meta.style}</div>}
            {typeof img.meta?.styleIntensity === 'number' && <div className="text-[11px] text-gray-400 mb-1">Intenzitás: {img.meta.styleIntensity}</div>}
            {img.meta?.camera && <div className="text-[11px] text-gray-500 mb-1">Kamera: {img.meta.camera}</div>}
            {img.meta?.aspectRatio && <div className="text-[11px] text-gray-500 mb-1">Képarány: {img.meta.aspectRatio}</div>}
            {img.meta?.locationProfileId && <div className="text-[11px] text-emerald-400/90 mb-1">Helyszínprofil: {img.meta.locationProfileId}</div>}
            {img.meta?.shotTemplateId && <div className="text-[11px] text-emerald-300/80 mb-1">Beállítás: {img.meta.shotTemplateId}</div>}
            {img.meta?.locationFingerprint && <div className="text-[11px] text-gray-500 mb-1">Ujjlenyomat: {img.meta.locationFingerprint}</div>}
            {Array.isArray(img.meta?.characterIds) && img.meta!.characterIds!.length > 1 && <div className="text-[11px] text-gray-500 mb-1">Szereplők: {img.meta!.characterIds!.join(', ')}</div>}
            <div className="flex items-center gap-2 mt-1">
              <a href={img.url} download className="text-blue-400 hover:underline text-xs">Letöltés</a>
              {onUseForAnimation && <button type="button" onClick={() => onUseForAnimation(img.url)} className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-700 hover:border-indigo-500 px-2 py-0.5 rounded transition-colors">▶ Animálás</button>}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
        <div>{pageImages.length} / {images.length} kép megjelenítve</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage <= 1} className="px-2 py-1 rounded border border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500">Előző</button>
          <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages} className="px-2 py-1 rounded border border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-gray-500">Következő</button>
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setSelectedIndex(null)} role="dialog" aria-modal="true" aria-label="Kép előnézete, a bal és jobb nyíllal lehet lépkedni">
          <div className="relative max-w-6xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setSelectedIndex(null)} className="absolute -top-10 right-0 text-white text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded">Bezárás</button>
            <img src={selectedImage.url} alt={selectedImage.filename} className="max-h-[85vh] max-w-full object-contain rounded shadow-2xl" />
            <div className="text-gray-300 text-xs mt-2">{new Date(selectedImage.created).toLocaleString('hu-HU')}</div>
            {selectedImage.meta?.style && <div className="text-gray-300 text-xs mt-1">Stílus: {selectedImage.meta.style}</div>}
            {typeof selectedImage.meta?.styleIntensity === 'number' && <div className="text-gray-400 text-xs mt-1">Intenzitás: {selectedImage.meta.styleIntensity}</div>}
            {selectedImage.meta?.camera && <div className="text-gray-500 text-xs mt-1">Kamera: {selectedImage.meta.camera}</div>}
            {selectedImage.meta?.aspectRatio && <div className="text-gray-500 text-xs mt-1">Képarány: {selectedImage.meta.aspectRatio}</div>}
            {selectedImage.meta?.locationProfileId && <div className="text-emerald-400 text-xs mt-1">Helyszínprofil: {selectedImage.meta.locationProfileId}</div>}
            {selectedImage.meta?.shotTemplateId && <div className="text-emerald-300 text-xs mt-1">Beállítássablon: {selectedImage.meta.shotTemplateId}</div>}
            {selectedImage.meta?.locationFingerprint && <div className="text-gray-500 text-xs mt-1">Ujjlenyomat: {selectedImage.meta.locationFingerprint}</div>}
            {selectedImage.meta?.continuityNotes && <div className="text-gray-400 text-xs mt-1 max-w-2xl text-center">Folytonossági jegyzetek: {selectedImage.meta.continuityNotes}</div>}
            {Array.isArray(selectedImage.meta?.characterIds) && selectedImage.meta!.characterIds!.length > 1 && <div className="text-gray-500 text-xs mt-1">Szereplők: {selectedImage.meta!.characterIds!.join(', ')}</div>}
          </div>
        </div>
      )}
    </>
  );
}
