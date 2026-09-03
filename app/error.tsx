'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-black text-gray-100 font-mono flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-gray-800 bg-gray-900 p-6">
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-gray-400 mb-4">
          An unexpected error occurred while rendering this route.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-600"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
