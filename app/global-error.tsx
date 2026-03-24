'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error caught:', error);
    console.error('Error stack:', error.stack);
    console.error('Error digest:', error.digest);
  }, [error]);

  return (
    <html>
      <body style={{ background: '#000', color: '#f3f4f6', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '600px' }}>
          <h2 style={{ marginBottom: 16 }}>Something went wrong</h2>
          <pre style={{ background: '#1a1a1a', padding: '16px', borderRadius: '8px', textAlign: 'left', overflow: 'auto', fontSize: '12px', marginBottom: '16px' }}>
            {error.message}
          </pre>
          <button
            onClick={() => reset()}
            style={{ padding: '8px 16px', background: '#a855f7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
