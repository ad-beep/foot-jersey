'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ShoppingBag, Plus, Minus, Trash2, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/stores/cart-store';
import { useHydration } from '@/hooks/useHydration';
import { useLocale } from '@/hooks/useLocale';
import { getJerseyName } from '@/lib/utils';
import { CURRENCY, SHIPPING_POLICY } from '@/lib/constants';
import type { Dictionary } from '@/i18n/dictionaries';
import type { CartItem } from '@/types';

interface CartDrawerProps {
  dict: Dictionary;
}

function CartItemRow({ item }: { item: CartItem }) {
  const { locale, isRtl } = useLocale();
  const isHe = locale === 'he';
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const displayName = getJerseyName(item.jersey, locale);
  const lineTotal = item.totalPrice * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: isRtl ? -80 : 80 }}
      transition={{ duration: 0.2 }}
      className="flex gap-3 py-4"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Thumbnail */}
      <Link
        href={`/${locale}/product/${item.jerseyId}`}
        className="shrink-0 w-[72px] h-[90px] rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Image
          src={item.jersey.imageUrl}
          alt={displayName}
          width={72}
          height={90}
          className="w-full h-full object-cover"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/${locale}/product/${item.jerseyId}`}
          className="text-sm font-semibold text-white line-clamp-2 hover:text-[var(--accent)] transition-colors"
        >
          {displayName}
        </Link>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
            {item.size}
          </span>
          {(item.customization.customName || item.customization.customNumber) && (
            <span className="text-xs" style={{ color: 'var(--accent)' }}>
              {item.customization.customName} {item.customization.customNumber ? `#${item.customization.customNumber}` : ''}
            </span>
          )}
        </div>

        {item.customization.hasPatch && (
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            + {isHe ? "פאצ'" : 'Patch'}{item.customization.patchText ? `: ${item.customization.patchText}` : ''}
          </p>
        )}
        {item.customization.hasPants && (
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            + {isHe ? 'מכנסיים' : 'Pants'}
          </p>
        )}
        {item.customization.isPlayerVersion && (
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            + {isHe ? 'גרסת שחקן' : 'Player Version'}
          </p>
        )}

        {/* Price + Qty row */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
            {CURRENCY}{lineTotal}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => updateQuantity(item.jerseyId, item.size, item.quantity - 1)}
              className="w-9 h-9 rounded-md flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
              aria-label={isHe ? 'הפחת' : 'Decrease'}
            >
              {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <span className="text-sm font-semibold text-white w-6 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.jerseyId, item.size, item.quantity + 1)}
              className="w-9 h-9 rounded-md flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
              aria-label={isHe ? 'הוסף' : 'Increase'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function FreeShippingIndicator({ itemCount, isHe }: { itemCount: number; isHe: boolean }) {
  const threshold = SHIPPING_POLICY.freeShippingMinItems;
  const remaining = threshold - itemCount;
  const progress = Math.min(itemCount / threshold, 1);

  return (
    <div className="px-6 py-3" style={{ backgroundColor: 'rgba(0,195,216,0.04)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Truck className="w-4 h-4 shrink-0" style={{ color: progress >= 1 ? 'var(--accent)' : 'var(--text-muted)' }} />
        <p className="text-xs" style={{ color: progress >= 1 ? 'var(--accent)' : 'var(--text-secondary)' }}>
          {progress >= 1
            ? (isHe ? 'משלוח חינם!' : 'Free shipping!')
            : (isHe ? `הוסף עוד ${remaining} חולצ${remaining === 1 ? 'ה' : 'ות'} למשלוח חינם` : `Add ${remaining} more jersey${remaining === 1 ? '' : 's'} for free shipping`)}
        </p>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: progress >= 1 ? 'var(--accent)' : 'var(--cta)',
          }}
        />
      </div>
    </div>
  );
}

export function CartDrawer({ dict: _dict }: CartDrawerProps) {
  const isOpen = useCartStore((s) => s.isOpen);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const items = useCartStore((s) => s.items);
  const getItemCount = useCartStore((s) => s.getItemCount);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const hydrated = useHydration();
  const { isRtl, locale } = useLocale();
  const isHe = locale === 'he';

  const itemCount = hydrated ? getItemCount() : 0;
  const subtotal = hydrated ? getSubtotal() : 0;
  const hasItems = hydrated && items.length > 0;

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setCartOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCartOpen]);

  const panelStyle = isRtl ? { left: 0 } : { right: 0 };
  const slideOut = isRtl ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setCartOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            className="fixed top-0 bottom-0 z-[70] w-full max-w-[420px] flex flex-col"
            style={{
              ...panelStyle,
              backgroundColor: 'var(--bg-secondary)',
              borderInlineStart: '1px solid var(--border)',
            }}
            initial={{ x: slideOut }}
            animate={{ x: 0 }}
            exit={{ x: slideOut }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label={isHe ? 'עגלת קניות' : 'Shopping cart'}
          >
            {/* Header row */}
            <div
              className="flex items-center justify-between px-6 py-4 shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                <h2 className="font-montserrat font-bold text-white text-lg">
                  {isHe ? 'עגלת קניות' : 'Your Cart'}
                </h2>
                {hasItems && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'rgba(0,195,216,0.12)', color: 'var(--accent)' }}
                  >
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200"
                style={{ color: 'var(--text-muted)' }}
                aria-label={isHe ? 'סגור' : 'Close cart'}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {hasItems ? (
              <>
                {/* Free shipping bar */}
                <FreeShippingIndicator itemCount={itemCount} isHe={isHe} />

                {/* Cart items */}
                <div className="flex-1 overflow-y-auto px-6">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartItemRow key={`${item.jerseyId}-${item.size}`} item={item} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                  {/* Subtotal */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {isHe ? 'סה"כ' : 'Subtotal'}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {CURRENCY}{subtotal}
                    </span>
                  </div>

                  {/* View Cart button */}
                  <Link
                    href={`/${locale}/cart`}
                    onClick={() => setCartOpen(false)}
                    className="block w-full py-3.5 rounded-xl font-bold text-sm text-center text-white transition-all duration-200"
                    style={{ backgroundColor: 'var(--cta)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    {isHe ? 'צפה בעגלה ולקופה' : 'View Cart & Checkout'}
                  </Link>

                  <button
                    onClick={() => setCartOpen(false)}
                    className="w-full mt-2 py-2.5 text-sm text-center transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {isHe ? 'המשך לקנות' : 'Continue Shopping'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Empty state */}
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-elevated, rgba(255,255,255,0.04))' }}
                  >
                    <ShoppingBag className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <p className="font-semibold text-white">
                    {isHe ? 'העגלה ריקה' : 'Your cart is empty'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {isHe ? 'הוסף חולצות כדי להתחיל' : 'Add jerseys to get started'}
                  </p>
                </div>

                {/* Footer CTA */}
                <div className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all duration-200"
                    style={{ backgroundColor: 'var(--cta)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    {isHe ? 'המשך לקנות' : 'Continue Shopping'}
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
