'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, Globe, X } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useCartStore } from '@/stores/cart-store';
import { useFavoritesStore } from '@/stores/favorites-store';
import { useAuthStore } from '@/stores/auth-store';
import { SearchBar } from '@/components/search/SearchBar';
import { cn } from '@/lib/utils';
import type { Dictionary } from '@/i18n/dictionaries';

interface HeaderProps {
  dict: Dictionary;
}

export function Header({ dict: _dict }: HeaderProps) {
  const { locale, isRtl, switchLocale } = useLocale();
  const pathname    = usePathname();
  const hydrated    = useHydration();
  const cartCount   = useCartStore((s) => s.items.length);
  const favCount    = useFavoritesStore((s) => s.favoriteIds.length);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const authUser    = useAuthStore((s) => s.user);

  const [scrolled,   setScrolled]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const toggleLocale = () => switchLocale(locale === 'en' ? 'he' : 'en');

  const isHomePage = pathname === `/${locale}` || pathname === `/${locale}/`;

  const handleCollectionsClick = useCallback(() => {
    if (isHomePage) {
      const el = document.getElementById('collections-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.location.href = `/${locale}#collections-section`;
  }, [locale, isHomePage]);

  // Derive first name from displayName
  const firstName = hydrated && authUser?.displayName
    ? authUser.displayName.split(' ')[0]
    : null;

  // Icon button shared style helpers
  const iconBtn = 'relative w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200';

  return (
    <header
      className={cn('fixed top-0 inset-x-0 z-50 h-16 transition-all duration-300')}
      style={
        scrolled
          ? { backgroundColor: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }
          : { backgroundColor: 'transparent' }
      }
    >
      <div className="h-full max-w-[1200px] mx-auto px-4 md:px-6 flex items-center gap-3 md:gap-4">

        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 shrink-0 group"
          aria-label="FootJersey home"
        >
          <span
            className="w-2 h-2 rounded-full shrink-0 transition-all duration-200 group-hover:scale-125"
            style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}
          />
          <span className="font-montserrat font-bold text-white text-lg tracking-tight leading-none">
            FootJersey
          </span>
        </Link>

        {/* ── Desktop "Our Collections" button ─────────────────── */}
        <button
          onClick={handleCollectionsClick}
          className="hidden md:inline-flex text-sm font-medium transition-colors duration-200 shrink-0 cursor-pointer"
          style={{ color: '#E0E0E0' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#E0E0E0'; }}
        >
          {locale === 'he' ? 'הקולקציות שלנו' : 'Our Collections'}
        </button>

        {/* ── Desktop search bar ────────────────────────────────── */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <SearchBar className="w-full" />
        </div>

        {/* ── Right icon cluster ────────────────────────────────── */}
        <div className="flex items-center gap-0.5 ms-auto">

          {/* Mobile: search icon */}
          <button
            className={cn(iconBtn, 'md:hidden')}
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Auth: Sign Up or Hello [Name] — farthest left in cluster */}
          <Link
            href={hydrated && authUser ? `/${locale}/profile` : `/${locale}/auth`}
            className="flex items-center px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 shrink-0"
            style={{
              color: hydrated && firstName ? 'var(--accent)' : '#000',
              backgroundColor: hydrated && firstName ? 'transparent' : 'var(--accent)',
              border: hydrated && firstName ? '1px solid var(--accent)' : '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (hydrated && firstName) {
                el.style.backgroundColor = 'rgba(0,195,216,0.1)';
              } else {
                el.style.opacity = '0.85';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (hydrated && firstName) {
                el.style.backgroundColor = 'transparent';
              } else {
                el.style.opacity = '1';
              }
            }}
          >
            {hydrated && firstName
              ? (locale === 'he' ? `שלום ${firstName}` : `Hello ${firstName}`)
              : (locale === 'he' ? 'הרשמה' : 'Sign Up')}
          </Link>

          {/* Language toggle */}
          <button
            onClick={toggleLocale}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-wider transition-all duration-200"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            aria-label={`Switch to ${locale === 'en' ? 'Hebrew' : 'English'}`}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color       = 'var(--accent)';
              el.style.borderColor = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.color       = 'var(--text-muted)';
              el.style.borderColor = 'var(--border)';
            }}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:block">{locale === 'en' ? 'HE' : 'EN'}</span>
          </button>

          {/* Favorites */}
          <Link
            href={`/${locale}/favorites`}
            className={iconBtn}
            style={{ color: 'var(--text-muted)' }}
            aria-label="Favorites"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <Heart className="w-5 h-5" />
            {hydrated && favCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-[17px] h-[17px] rounded-full flex items-center justify-center text-[9px] font-black text-black"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {favCount > 9 ? '9+' : favCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <button
            className={iconBtn}
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <ShoppingBag className="w-5 h-5" />
            {hydrated && cartCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-[17px] h-[17px] rounded-full flex items-center justify-center text-[9px] font-black text-white"
                style={{ backgroundColor: 'var(--cta)' }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile search overlay ─────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[80] flex flex-col"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex-1">
              <SearchBar mobile onClose={() => setSearchOpen(false)} />
            </div>
            <button
              onClick={() => setSearchOpen(false)}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
