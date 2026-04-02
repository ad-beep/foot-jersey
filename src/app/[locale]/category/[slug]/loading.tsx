export default function Loading() {
  return (
    <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ height: 32, width: 200, background: '#1a1a1a', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ background: '#111', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '3/4', background: '#1a1a1a' }} />
            <div style={{ padding: 12 }}>
              <div style={{ height: 16, background: '#1a1a1a', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 14, width: '60%', background: '#1a1a1a', borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
