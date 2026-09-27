'use client';

import LoadingScreen from '../components/LoadingScreen';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Package = {
  id: string;
  name: string;
  credits: number;
  characterSlots: number;
  amountHuf: number;
};

type PurchaseStatus = {
  fulfilled: boolean;
  paymentStatus: string | null;
  purchase: {
    package_id: string;
    credits: number;
    character_slots: number;
    amount: number;
    currency: string;
    status: string;
  } | null;
};

export default function CreditsPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [purchaseChecking, setPurchaseChecking] = useState(false);

  useEffect(() => {
    fetch('/api/credits/packages')
      .then((res) => res.json())
      .then((data) => setPackages(Array.isArray(data.packages) ? data.packages : []))
      .catch(() => setError('Nem sikerült betölteni a kreditcsomagokat.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const success = params.get('success');
    const canceled = params.get('canceled');

    if (canceled === '1') {
      setPurchaseMessage('A fizetést megszakítottad. Nem történt kreditjóváírás.');
      window.history.replaceState({}, '', '/credits');
      return;
    }

    if (success !== '1' || !sessionId) return;

    let cancelled = false;
    let attempts = 0;
    setPurchaseChecking(true);
    setPurchaseMessage('Fizetés sikeres. A kreditek jóváírását ellenőrizzük…');

    const check = async () => {
      try {
        const res = await fetch('/api/credits/status?session_id=' + encodeURIComponent(sessionId), {
          cache: 'no-store',
        });
        const data = (await res.json()) as PurchaseStatus | { error?: string };

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(('error' in data && data.error) || 'Nem sikerült ellenőrizni a fizetés állapotát.');
        }

        const status = data as PurchaseStatus;

        if (status.fulfilled) {
          const purchase = status.purchase;
          setPurchaseMessage(
            purchase
              ? `Kész. +${purchase.credits} kredit${purchase.character_slots ? ` és +${purchase.character_slots} karakterhely` : ''} jóváírva.`
              : 'Kész. A vásárlás jóváírva.'
          );
          setPurchaseChecking(false);
          window.history.replaceState({}, '', '/credits');
          return;
        }

        attempts += 1;
        if (attempts >= 8) {
          setPurchaseMessage('A fizetés megtörtént, a jóváírás még feldolgozás alatt van. Frissíts később, ha még nem jelent meg.');
          setPurchaseChecking(false);
          window.history.replaceState({}, '', '/credits');
          return;
        }

        window.setTimeout(check, 1500);
      } catch (e: any) {
        if (cancelled) return;
        setPurchaseMessage(e?.message || 'A fizetés állapotát nem sikerült ellenőrizni.');
        setPurchaseChecking(false);
        window.history.replaceState({}, '', '/credits');
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  const buy = async (packageId: string) => {
    setBuying(packageId);
    setError('');
    setPurchaseMessage('');
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Nem sikerült elindítani a fizetést.');
      window.location.href = data.url;
    } catch (e: any) {
      setError(e?.message || 'Fizetési hiba.');
      setBuying(null);
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 font-mono px-4 md:px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="text-xs tracking-[0.3em] text-zinc-600 mb-2">V3 / CREDITS</div>
          <h1 className="text-3xl font-bold">Kreditek</h1>
          <p className="text-sm text-zinc-500 mt-2">Vásárolj kreditcsomagot, és használd fel képgenerálásra vagy karakterkapacitásra.</p>
        </div>

        {purchaseMessage && (
          <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
            {purchaseMessage}
            {purchaseChecking && <span className="ml-2 text-zinc-500">●</span>}
          </div>
        )}

        {loading && <LoadingScreen />}

        {!loading && packages.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-sm text-zinc-500">
            Jelenleg nincs aktív kreditcsomag. A Stripe csomagok szerveroldali konfigurációval kapcsolhatók be.
          </div>
        )}

        {error && <div className="mb-5 rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-400">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {packages.map((pack) => (
            <div key={pack.id} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <div className="text-sm font-semibold text-zinc-300">{pack.name}</div>
              <div className="text-3xl font-bold mt-3">{pack.credits}</div>
              <div className="text-xs text-zinc-500">kredit</div>

              {pack.characterSlots > 0 && (
                <div className="mt-4 text-sm text-zinc-400">+ {pack.characterSlots} saját karakterhely</div>
              )}

              <div className="mt-6 text-2xl font-bold">
                {pack.amountHuf.toLocaleString('hu-HU')} Ft
              </div>

              <button
                type="button"
                onClick={() => buy(pack.id)}
                disabled={buying !== null}
                className="mt-5 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                {buying === pack.id ? 'Átirányítás…' : 'Vásárlás'}
              </button>
            </div>
          ))}
        </div>

        <Link href="/" className="inline-block mt-8 text-sm text-zinc-500 hover:text-white">
          ← Vissza
        </Link>
      </div>
    </main>
  );
}
