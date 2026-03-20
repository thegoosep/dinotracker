'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: '#000', color: '#f3f4f6', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: 16 }}>Something went wrong</h2>
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
