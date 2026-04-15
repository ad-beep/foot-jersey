'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, User, ShoppingBag } from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';

const ITEMS = [
  { icon: Home,        label: { en: 'Home',       he: 'בית'      }, key: 'home'       },
  { icon: Sparkles,    label: { en: 'Discover',   he: 'גלה'      }, key: 'discover'   },
  { icon: User,        label: { en: 'Profile',    he: 'פרופיל'   }, key: 'profile'    },
  { icon: ShoppingBag, label: { en: 'Cart',       he: 'עגלה'     }, key: 'cart'       },
] as const;

export function Dock() {
  const { locale }  = useLocale();
  const pathname    = usePathname();
  const hydrated    = useHydration();
  const cartCount   = useCartStore((s) => s.items.length);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const authUser    = useAuthStore((s) => s.user);

  const isActive = (key: string): boolean => {
    const base = `/${locale}`;
    if (key === 'home') return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(`${base}/${key}`);
  };

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 h-16"
      style={{
        backgroundColor: 'rgba(17,17,17,0.95)',
        backdropFilter:  'blur(12px)',
        borderTop:       '1px solid rgba(255,255,255,0.08)',
      }}
      aria-label="Bottom navigation"
    >
      <div className="flex h-full">
        {ITEMS.map(({ icon: Icon, label, key }) => {
          const active = isActive(key);
          const isProfile = key === 'profile';
          const href   = key === 'home'
            ? `/${locale}`
            : isProfile && hydrated && !authUser
              ? `/${locale}/auth`
              : `/${locale}/${key}`;
          const isCart = key === 'cart';
          const count  = hydrated && isCart ? cartCount : 0;

          const inner = (
            <>
              {/* Active dot indicator */}
              <div className="h-1 flex items-center justify-center mb-0.5">
                {active && (
                  <span
                    className="block w-4 h-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--gold)' }}
                  />
                )}
              </div>

              {/* Icon + badge */}
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
                {isCart && count > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 w-[17px] h-[17px] rounded-full flex items-center justify-center text-[9px] font-black text-white"
                    style={{ backgroundColor: 'var(--cta)' }}
                  >
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] font-semibold leading-none mt-0.5">
                {locale === 'he' ? label.he : label.en}
              </span>
            </>
          );

          if (isCart) {
            return (
              <button
                key={key}
                onClick={() => setCartOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 active:scale-95"
                style={{ color: active ? 'var(--gold)' : 'var(--text-muted)' }}
                aria-label={label.en}
              >
                {inner}
              </button>
            );
          }

          return (
            <Link
              key={key}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-200 active:scale-95"
              style={{ color: active ? 'var(--gold)' : 'var(--text-muted)' }}
              aria-label={label.en}
              aria-current={active ? 'page' : undefined}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
