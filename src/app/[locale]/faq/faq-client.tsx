'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '@/data/faqs';
import type { Locale } from '@/types';

const CATEGORIES = {
  trust:    { en: 'Trust & Safety',    he: 'אמינות ובטיחות' },
  ordering: { en: 'Ordering',          he: 'הזמנות' },
  shipping: { en: 'Shipping',          he: 'משלוח' },
  payment:  { en: 'Payment',           he: 'תשלום' },
  product:  { en: 'Products',          he: 'מוצרים' },
  returns:  { en: 'Returns',           he: 'החזרות' },
};

type CategoryKey = keyof typeof CATEGORIES;

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
        className={`w-full flex items-start gap-4 py-5 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span
          className="flex-1 font-medium text-sm md:text-base leading-snug"
          style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.85)' }}
        >
          {question}
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 mt-0.5 transition-transform duration-300"
          style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      <div style={{ maxHeight: isOpen ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.22,1,0.36,1)' }}>
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

export function FAQPageClient({ locale }: { locale: Locale }) {
  const isHe = locale === 'he';
  const isRtl = isHe;
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');

  const filtered = FAQS.filter(
    (f) => activeCategory === 'all' || f.category === activeCategory,
  );

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--ink)' }}
    >
      {/* Header */}
      <div
        className="py-16 md:py-24"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className={`max-w-[800px] mx-auto px-4 md:px-6 ${isRtl ? 'text-right' : ''}`}>
          <p className="section-kicker mb-4">
            {isHe ? 'מרכז עזרה' : 'Help Center'}
          </p>
          <h1
            className="font-playfair font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {isHe ? 'שאלות נפוצות' : 'Frequently Asked\nQuestions'}
          </h1>
          <p className="text-base" style={{ color: 'var(--muted)' }}>
            {isHe
              ? 'מצא תשובות לשאלות הנפוצות ביותר. לא מצאת מה שחיפשת?'
              : "Find answers to the most common questions. Didn't find what you need?"}
            {' '}
            <a href="https://wa.me/972584140508" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--gold)' }}>
              {isHe ? 'שלח לנו הודעה ב-WhatsApp' : 'WhatsApp us'}
            </a>
          </p>
        </div>
      </div>

      <div className="max-w-[800px] mx-auto px-4 md:px-6 py-12">
        {/* Category filter */}
        <div className={`flex flex-wrap gap-2 mb-10 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => setActiveCategory('all')}
            className="px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wide transition-all duration-200"
            style={
              activeCategory === 'all'
                ? { backgroundColor: 'var(--pitch)', color: '#fff', border: '1px solid var(--pitch-light)' }
                : { backgroundColor: 'var(--steel)', color: 'var(--muted)', border: '1px solid var(--border)' }
            }
          >
            {isHe ? 'הכל' : 'All'}
          </button>
          {(Object.entries(CATEGORIES) as [CategoryKey, { en: string; he: string }][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className="px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wide transition-all duration-200"
              style={
                activeCategory === key
                  ? { backgroundColor: 'var(--pitch)', color: '#fff', border: '1px solid var(--pitch-light)' }
                  : { backgroundColor: 'var(--steel)', color: 'var(--muted)', border: '1px solid var(--border)' }
              }
            >
              {isHe ? label.he : label.en}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--steel)' }}
        >
          <div className="px-5 md:px-6">
            {filtered.map((faq) => (
              <AccordionItem
                key={faq.id}
                question={faq.question[locale]}
                answer={faq.answer[locale]}
                isOpen={openId === faq.id}
                onToggle={() => setOpenId(openId === faq.id ? null : faq.id)}
                isRtl={isRtl}
              />
            ))}
          </div>
        </div>

        {/* Still need help */}
        <div
          className={`mt-12 p-6 rounded-xl flex flex-col md:flex-row items-center gap-4 ${isRtl ? 'text-right md:flex-row-reverse' : ''}`}
          style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
        >
          <div className="flex-1">
            <p className="font-semibold text-white text-sm mb-1">
              {isHe ? 'עדיין לא מצאת תשובה?' : 'Still need help?'}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {isHe
                ? 'הצוות שלנו זמין ב-WhatsApp בעברית ואנגלית.'
                : 'Our team is available on WhatsApp in Hebrew & English.'}
            </p>
          </div>
          <a
            href="https://wa.me/972584140508"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-white shrink-0 transition-all duration-200"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            {isHe ? 'שלח הודעה' : 'Chat with us'}
          </a>
        </div>
      </div>
    </div>
  );
}
