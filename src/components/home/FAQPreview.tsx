'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { Reveal } from '@/components/ui/reveal';
import { getHomepageFaqs } from '@/data/faqs';

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  isRtl,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  isRtl: boolean;
}) {
  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <button
        className={`w-full flex items-start gap-4 py-5 text-left transition-all duration-200 ${isRtl ? 'flex-row-reverse text-right' : ''}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span
          className="font-semibold text-sm md:text-base flex-1 leading-snug"
          style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.85)' }}
        >
          {question}
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 mt-0.5 transition-transform duration-300"
          style={{
            color: 'var(--muted)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      <div
        style={{
          maxHeight: isOpen ? '500px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <p
          className={`pb-5 text-sm leading-relaxed ${isRtl ? 'text-right' : ''}`}
          style={{ color: 'var(--muted)' }}
        >
          {answer}
        </p>
      </div>
    </div>
  );
}

export function FAQPreview() {
  const { locale, isRtl } = useLocale();
  const isHe = locale === 'he';
  const faqs = getHomepageFaqs(locale as 'en' | 'he', 5);
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  return (
    <section
      className="py-16 md:py-24"
      style={{ backgroundColor: 'var(--ink)', borderTop: '1px solid var(--border)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">

          {/* Left: header */}
          <div className={`lg:col-span-2 ${isHe ? 'text-right' : ''}`}>
            <Reveal>
              <p className="section-kicker mb-3">
                {isHe ? 'שאלות נפוצות' : 'FAQ'}
              </p>
              <h2
                className="font-playfair font-bold text-white mb-4"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.03em', lineHeight: 1.05 }}
              >
                {isHe ? 'תשובות לכל השאלות שלך' : 'Everything you need to know'}
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--muted)' }}>
                {isHe
                  ? 'יש לך עוד שאלות? אנחנו זמינים ב-WhatsApp 24/7.'
                  : "Still have questions? We're available on WhatsApp 24/7."}
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href={`/${locale}/faq`}
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: 'var(--gold)' }}
                >
                  {isHe ? '← ראה את כל השאלות' : 'See all questions →'}
                </Link>
                <a
                  href="https://wa.me/972584140508"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--muted)' }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                  </svg>
                  {isHe ? 'שלח לנו הודעה ב-WhatsApp' : 'Message us on WhatsApp'}
                </a>
              </div>
            </Reveal>
          </div>

          {/* Right: accordion */}
          <div className="lg:col-span-3">
            <Reveal delay={100}>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--steel)' }}
              >
                <div className="px-5 md:px-6">
                  {faqs.map((faq) => (
                    <AccordionItem
                      key={faq.id}
                      question={faq.question}
                      answer={faq.answer}
                      isOpen={openId === faq.id}
                      onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                      isRtl={isRtl}
                    />
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
