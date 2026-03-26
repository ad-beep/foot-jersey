'use client';

import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';

export function Footer() {
  const { locale } = useLocale();
  const isHe = locale === 'he';

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: '#0A0A0A', borderColor: 'var(--border)' }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-3 gap-10 mb-10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}
              />
              <span className="font-montserrat font-bold text-white text-base tracking-tight">
                FootJersey
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {isHe
                ? 'חולצות כדורגל פרמיום — אותנטיות, משלוח מהיר.'
                : 'Premium football jerseys — authentic, fast delivery.'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3
              className="text-[11px] font-black uppercase tracking-[0.2em] mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isHe ? 'קישורים מהירים' : 'Quick Links'}
            </h3>
            <ul className="space-y-2.5">
              {[
                { en: 'Home',       he: 'דף הבית',  href: `/${locale}`             },
                { en: 'Discover',   he: 'גלה',       href: `/${locale}/discover`    },
                { en: 'About',      he: 'אודות',     href: `/${locale}#about`       },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors duration-200 hover:text-white inline-block py-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {isHe ? item.he : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3
              className="text-[11px] font-black uppercase tracking-[0.2em] mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isHe ? 'משפטי' : 'Legal'}
            </h3>
            <ul className="space-y-2.5">
              {[
                { en: 'Privacy Policy',   he: 'מדיניות פרטיות', href: `/${locale}/privacy`  },
                { en: 'Terms of Service', he: 'תנאי שימוש',      href: `/${locale}/terms`    },
                { en: 'Refund Policy',    he: 'מדיניות החזרים',  href: `/${locale}/refund`   },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors duration-200 hover:text-white inline-block py-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {isHe ? item.he : item.en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t pt-6 text-center" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © 2026 FootJersey.{' '}
            {isHe ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
