export default function Loading() {
  return (
    <div style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <div style={{ flex: '0 0 400px', aspectRatio: '1', background: '#1a1a1a', borderRadius: 16 }} />
      <div style={{ flex: 1, minWidth: 280 }}>
        <div style={{ height: 36, width: '70%', background: '#1a1a1a', borderRadius: 6, marginBottom: 16 }} />
        <div style={{ height: 24, width: '30%', background: '#1a1a1a', borderRadius: 4, marginBottom: 32 }} />
        <div style={{ height: 48, background: '#1a1a1a', borderRadius: 8, marginBottom: 12 }} />
        <div style={{ height: 48, background: '#1a1a1a', borderRadius: 8 }} />
      </div>
    </div>
  );
}
