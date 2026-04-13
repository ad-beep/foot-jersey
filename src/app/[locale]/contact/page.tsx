import type { Metadata } from 'next';
import { localBusinessSchema } from '@/lib/schema';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const isHe = params.locale === 'he';
  return {
    title: isHe ? 'צור קשר — FootJersey' : 'Contact Us — FootJersey',
    description: isHe
      ? 'פנה אל FootJersey דרך WhatsApp, אינסטגרם, או טיקטוק. תגובה תוך שעתיים.'
      : 'Contact FootJersey via WhatsApp, Instagram, or TikTok. Response within 2 hours.',
  };
}

export default function ContactPage({ params }: { params: { locale: string } }) {
  const isHe = params.locale === 'he';
  const locale = params.locale;
  const schema = localBusinessSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
        {/* Header */}
        <div className="py-20 md:py-28" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className={`max-w-[700px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
            <p className="section-kicker mb-4">{isHe ? 'יצירת קשר' : 'Get in Touch'}</p>
            <h1
              className="font-playfair font-bold text-white mb-4"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {isHe ? 'אנחנו כאן בשבילך.' : 'We\'re here for you.'}
            </h1>
            <p className="text-base" style={{ color: 'var(--muted)' }}>
              {isHe
                ? 'יש לך שאלה על הזמנה? צריך עזרה? שלח לנו הודעה ונחזור אליך תוך שעתיים.'
                : 'Have a question about your order? Need help? Send us a message and we\'ll get back to you within 2 hours.'}
            </p>
          </div>
        </div>

        {/* Contact options */}
        <div className="max-w-[700px] mx-auto px-4 md:px-6 py-12">
          <div className="space-y-4">
            {/* WhatsApp — primary */}
            <a
              href="https://wa.me/972584140508"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-5 p-6 rounded-xl transition-all duration-200 ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#25D366'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </div>
              <div className={`flex-1 ${isHe ? 'text-right' : ''}`}>
                <p className="font-semibold text-white text-sm">WhatsApp</p>
                <p className="font-mono text-sm mt-0.5" style={{ color: '#25D366' }}>+972-58-414-0508</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {isHe ? '⚡ תגובה תוך שעתיים' : '⚡ Response within 2 hours'}
                </p>
              </div>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/foot_jersey4"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-5 p-6 rounded-xl transition-all duration-200 ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E1306C'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect width={20} height={20} x={2} y={2} rx={5} />
                  <circle cx={12} cy={12} r={5} />
                  <circle cx={17.5} cy={6.5} r={1.5} fill="currentColor" stroke="none" />
                </svg>
              </div>
              <div className={`flex-1 ${isHe ? 'text-right' : ''}`}>
                <p className="font-semibold text-white text-sm">Instagram</p>
                <p className="font-mono text-sm mt-0.5" style={{ color: '#E1306C' }}>@foot_jersey4</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {isHe ? 'DM לשאלות ועדכונים' : 'DM for questions & updates'}
                </p>
              </div>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@foot.jerseys4"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-5 p-6 rounded-xl transition-all duration-200 ${isHe ? 'flex-row-reverse' : ''}`}
              style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#69C9D0'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#010101' }}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.25 8.25 0 0 0 4.83 1.56V6.64a4.84 4.84 0 0 1-1.07.05Z" />
                </svg>
              </div>
              <div className={`flex-1 ${isHe ? 'text-right' : ''}`}>
                <p className="font-semibold text-white text-sm">TikTok</p>
                <p className="font-mono text-sm mt-0.5" style={{ color: '#69C9D0' }}>@foot.jerseys4</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {isHe ? 'עקוב לעדכונים ודרופים חדשים' : 'Follow for new drops & updates'}
                </p>
              </div>
            </a>
          </div>

          {/* Business info */}
          <div
            className={`mt-10 p-6 rounded-xl ${isHe ? 'text-right' : ''}`}
            style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
          >
            <p className="font-semibold text-white text-sm mb-4">
              {isHe ? 'פרטי העסק' : 'Business Details'}
            </p>
            <div className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
              <p><span className="text-white">FootJersey</span></p>
              <p>{isHe ? 'ישראל' : 'Israel'}</p>
              <p>{isHe ? 'שפות: עברית, אנגלית' : 'Languages: Hebrew, English'}</p>
              <p>{isHe ? 'שעות פעילות: 24/7 (WhatsApp)' : 'Hours: 24/7 (WhatsApp)'}</p>
              <p>{isHe ? 'תשלום: PayPal + BIT' : 'Payment: PayPal + BIT'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
