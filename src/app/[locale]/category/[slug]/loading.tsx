export default function Loading() {
  return (
    <div
      style={{
        padding: '32px 16px',
        maxWidth: 1200,
        margin: '0 auto',
        backgroundColor: 'var(--ink)',
        minHeight: '100vh',
      }}
    >
      {/* Breadcrumb skeleton */}
      <div
        style={{
          height: 16,
          width: 220,
          background: 'var(--steel)',
          borderRadius: 4,
          marginBottom: 24,
        }}
      />

      {/* Title skeleton */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            height: 36,
            width: 200,
            background: 'var(--steel)',
            borderRadius: 6,
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 14,
            width: 120,
            background: 'var(--steel)',
            borderRadius: 4,
          }}
        />
      </div>

      {/* Filter pill skeletons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 44,
              width: 80 + i * 12,
              background: 'var(--steel)',
              borderRadius: 9999,
              border: '1px solid var(--border)',
            }}
          />
        ))}
      </div>

      {/* Product grid skeletons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--steel)',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                aspectRatio: '3/4',
                background: 'linear-gradient(135deg, var(--steel) 0%, var(--steel-hover) 100%)',
              }}
            />
            <div style={{ padding: 12 }}>
              <div
                style={{
                  height: 14,
                  background: 'var(--steel-hover)',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 12,
                  width: '60%',
                  background: 'var(--steel-hover)',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
