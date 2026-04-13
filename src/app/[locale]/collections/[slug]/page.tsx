import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCollection, COLLECTIONS } from '@/data/collections';
import { collectionSchema, breadcrumbSchema } from '@/lib/schema';
import { SITE_URL } from '@/lib/constants';

export async function generateStaticParams() {
  return COLLECTIONS.flatMap((col) => [
    { locale: 'en', slug: col.slug },
    { locale: 'he', slug: col.slug },
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const col = getCollection(params.slug);
  if (!col) return { title: 'Not Found' };
  const isHe = params.locale === 'he';
  const c = isHe ? col.he : col.en;
  return {
    title: `${c.name} — FootJersey`,
    description: c.description,
    alternates: {
      canonical: `${SITE_URL}/en/collections/${params.slug}`,
      languages: {
        en: `${SITE_URL}/en/collections/${params.slug}`,
        he: `${SITE_URL}/he/collections/${params.slug}`,
      },
    },
  };
}

export default function CollectionPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const col = getCollection(params.slug);
  if (!col) notFound();

  const { locale } = params;
  const isHe = locale === 'he';
  const c = isHe ? col.he : col.en;

  const pageUrl = `${SITE_URL}/${locale}/collections/${params.slug}`;

  const schema = collectionSchema(c.name, c.description, pageUrl);
  const breadcrumbs = breadcrumbSchema([
    { name: isHe ? 'בית' : 'Home', href: `${SITE_URL}/${locale}` },
    { name: isHe ? 'קולקציות' : 'Collections', href: `${SITE_URL}/${locale}` },
    { name: c.name, href: pageUrl },
  ]);

  const discoverHref = `/${locale}/discover?collections=${col.categorySlug}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative py-24 md:py-36 overflow-hidden" style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse 60% 50% at 50% 100%, ${col.bgFrom} 0%, transparent 100%)` }}
            aria-hidden="true"
          />

          <div className={`relative max-w-[900px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <p className="section-kicker mb-4">{c.kicker}</p>
            <h1
              className="font-playfair font-bold text-white mb-6"
              style={{
                fontSize: 'clamp(3rem, 10vw, 7rem)',
                letterSpacing: '-0.05em',
                lineHeight: 0.9,
                whiteSpace: 'pre-line',
              }}
            >
              {c.headline}
            </h1>
            <p className="text-lg md:text-xl mb-10 max-w-[50ch]" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
              {c.description}
            </p>

            {/* Stats row */}
            <div className={`flex flex-wrap gap-8 mb-10 ${isHe ? 'flex-row-reverse' : ''}`}>
              {[
                { label: c.fact1Label, value: c.fact1Value },
                { label: c.fact2Label, value: c.fact2Value },
                { label: c.fact3Label, value: c.fact3Value },
              ].map((fact) => (
                <div key={fact.label} className={isHe ? 'text-right' : ''}>
                  <p className="font-mono font-bold text-2xl" style={{ color: col.accent }}>
                    {fact.value}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--muted)' }}>
                    {fact.label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={discoverHref}
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-opacity duration-200 hover:opacity-85 active:scale-95"
              style={{ backgroundColor: col.accent, color: '#000' }}
            >
              {c.ctaLabel}
              <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Story section ────────────────────────────────────────────────── */}
        <div className="max-w-[900px] mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className={`grid md:grid-cols-[1fr_2fr] gap-12 ${isHe ? 'md:grid-cols-[2fr_1fr]' : ''}`}>
            {/* Decorative label */}
            <div className={isHe ? 'text-right' : ''}>
              <div
                className="inline-block font-mono text-[9px] uppercase tracking-[0.3em] px-3 py-2 rounded mb-6"
                style={{ border: `1px solid ${col.accent}40`, color: col.accent }}
              >
                {isHe ? 'על הקולקציה' : 'The Collection'}
              </div>
              <div
                className="font-playfair font-bold italic select-none"
                style={{
                  fontSize: 'clamp(4rem, 12vw, 9rem)',
                  color: `${col.accent}18`,
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                }}
                aria-hidden="true"
              >
                {isHe ? col.he.name.split(' ')[0] : col.en.name.split(' ')[0]}
              </div>
            </div>

            {/* Body text */}
            <div className={isHe ? 'text-right' : ''}>
              <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {c.body}
              </p>
              <Link
                href={discoverHref}
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest pb-0.5 border-b border-[var(--border)] transition-colors duration-200 hover:border-[var(--gold)]"
                style={{ color: 'var(--muted)' }}
              >
                {c.ctaLabel} →
              </Link>
            </div>
          </div>
        </div>

        {/* ── Other collections ─────────────────────────────────────────────── */}
        <div className="border-t py-12 md:py-16" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-[900px] mx-auto px-4 md:px-6">
            <p className="section-kicker mb-6">{isHe ? 'קולקציות נוספות' : 'More collections'}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {COLLECTIONS.filter((other) => other.slug !== col.slug).map((other) => {
                const oc = isHe ? other.he : other.en;
                return (
                  <Link
                    key={other.slug}
                    href={`/${locale}/collections/${other.slug}`}
                    className="group p-4 rounded-xl transition-colors duration-200 border border-[var(--border)]"
                    style={{ backgroundColor: 'var(--steel)' }}
                  >
                    <p className="font-mono text-[9px] uppercase tracking-widest mb-2" style={{ color: other.accent }}>
                      {oc.kicker.split(' · ')[0]}
                    </p>
                    <p className="font-semibold text-sm text-white">{oc.name}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
