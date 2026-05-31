'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Trash2, Plus, Minus, Truck, ArrowLeft, ArrowRight,
  Package, CreditCard, X, AlertCircle, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useCartStore } from '@/stores/cart-store';
import { useToast } from '@/components/ui/toast';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Reveal } from '@/components/ui/reveal';
import { getJerseyName } from '@/lib/utils';
import { CURRENCY, SHIPPING_POLICY, CURRENCY_CODE, PRICES } from '@/lib/constants';
import { splitCart, SHIPMENT_LEG_LABELS, SPLIT_SHIPMENT_NOTICE, type SplitResult } from '@/lib/shipping-split';
import { PayPalPayment } from '@/components/payment/PayPalPayment';
import { PaymentMethodSelector, type PaymentMethod } from '@/components/payment/PaymentMethodSelector';
import { BitPayment, type BitSenderDetails } from '@/components/payment/BitPayment';
import type { CartItem } from '@/types';

// ─── Cart Item Row (full page) ──────────────────────────────────────────────

function CartItemCard({ item }: { item: CartItem }) {
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
      exit={{ opacity: 0, x: isRtl ? -60 : 60 }}
      transition={{ duration: 0.2 }}
      className="flex gap-4 p-4 rounded-xl"
      style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
    >
      {/* Image */}
      <Link
        href={`/${locale}/product/${item.jerseyId}`}
        className="shrink-0 w-[88px] h-[110px] rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--ink)' }}
      >
        <Image
          src={item.jersey.imageUrl}
          alt={displayName}
          width={88}
          height={110}
          sizes="88px"
          className="w-full h-full object-cover"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/${locale}/product/${item.jerseyId}`}
            className="text-sm font-semibold text-white line-clamp-2 hover:text-[var(--gold)] transition-colors"
          >
            {displayName}
          </Link>
          <button
            onClick={() => removeItem(item.jerseyId, item.size, item.customization)}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label={isHe ? 'הסר' : 'Remove'}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FF4D6D'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
          >
            {isHe ? 'מידה' : 'Size'}: {item.size}
          </span>
          {(item.customization.customName || item.customization.customNumber) && (
            <span className="text-xs" style={{ color: 'var(--gold)' }}>
              {item.customization.customName} {item.customization.customNumber ? `#${item.customization.customNumber}` : ''}
            </span>
          )}
        </div>

        {item.customization.hasPatch && (
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            + {isHe ? "פאצ'" : 'Patch'}{item.customization.patchText ? `: ${item.customization.patchText}` : ''}
          </p>
        )}
        {item.customization.hasPants && (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>+ {isHe ? 'מכנסיים' : 'Pants'}</p>
        )}
        {item.customization.isPlayerVersion && (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>+ {isHe ? 'גרסת שחקן' : 'Player Version'}</p>
        )}

        {/* Price + Qty */}
        <div className="flex items-center justify-between mt-3">
          <p className="text-base font-bold font-mono" style={{ color: 'var(--gold)' }}>
            {CURRENCY}{lineTotal}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateQuantity(item.jerseyId, item.size, item.customization, item.quantity - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
              aria-label={isHe ? 'הפחת' : 'Decrease'}
            >
              {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <span className="text-sm font-bold text-white w-7 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.jerseyId, item.size, item.customization, item.quantity + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
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

// ─── Abandoned-cart session helpers ────────────────────────────────────────
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem('cart_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('cart_session_id', id);
  }
  return id;
}

async function saveAbandonedCartData(
  sessionId: string,
  email: string,
  items: import('@/types').CartItem[],
  locale: string,
) {
  try {
    await fetch('/api/abandoned-cart/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        email,
        items: items.map((i) => ({
          jerseyId: i.jerseyId,
          name: i.jersey.nameEn || i.jersey.teamName,
          size: i.size,
          quantity: i.quantity,
          price: i.totalPrice,
          imageUrl: i.jersey.imageUrl,
        })),
        locale,
      }),
    });
  } catch {
    // best-effort — never block the UI
  }
}

async function clearAbandonedCart() {
  const sessionId = typeof window !== 'undefined' ? sessionStorage.getItem('cart_session_id') : null;
  if (!sessionId) return;
  try {
    await fetch('/api/abandoned-cart/save', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    sessionStorage.removeItem('cart_session_id');
  } catch {
    // best-effort
  }
}

// ─── Checkout Form ──────────────────────────────────────────────────────────

interface CheckoutForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  street: string;
  zip: string;
  notes: string;
  // Billing address fields
  billingCountry: string;
  billingCity: string;
  billingStreet: string;
  billingZip: string;
}

const EMPTY_FORM: CheckoutForm = {
  firstName: '', lastName: '', phone: '', email: '',
  country: '', city: '', street: '', zip: '', notes: '',
  billingCountry: '', billingCity: '', billingStreet: '', billingZip: '',
};

interface FieldError {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  street?: string;
  zip?: string;
}

function CheckoutSection({ isHe, isRtl, split }: {
  isHe: boolean;
  isRtl: boolean;
  split: SplitResult;
}) {
  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);
  const { toast } = useToast();
  const router = useRouter();
  const { locale } = useLocale();
  const { subtotal, shipping: shippingCost, itemCount, hasSplit, legs } = split;

  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bit');
  const [paymentError, setPaymentError] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);

  // Discount code — pre-fill from exit-intent popup if available
  const [discountCode, setDiscountCode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('exit_discount_code') || '';
    }
    return '';
  });
  const [discountApplied, setDiscountApplied] = useState<{ code: string; type: string; value: number; amount: number } | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);

  // ── Abandoned cart: re-save whenever items change and email is valid ──────
  useEffect(() => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return;
    const t = setTimeout(() => {
      saveAbandonedCartData(getOrCreateSessionId(), form.email.trim(), items, locale);
    }, 2000);
    return () => clearTimeout(t);
  }, [items, form.email, locale]);

  // Shipping already computed per-leg by splitCart (sum of per-leg flat fees).
  // freeShipping is used only by the free-shipping progress bar — we keep the
  // single-bag threshold view for the combined cart since both legs get the
  // same free-shipping threshold applied independently.
  const freeShipping = hasSplit
    ? legs.every((l) => l.freeShipping)
    : itemCount >= SHIPPING_POLICY.freeShippingMinItems;
  const discountAmount = discountApplied?.amount ?? 0;
  // Guard against negative totals (e.g. large discount on free-shipping order)
  // and round to avoid floating-point display artifacts (e.g. 119.99999)
  const finalTotal = Math.max(0, Math.round((subtotal + shippingCost - discountAmount) * 100) / 100);

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountError('');
    setDiscountLoading(true);
    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountApplied({ code: data.code, type: data.type, value: data.value, amount: data.discountAmount });
        setDiscountError('');
      } else {
        setDiscountApplied(null);
        setDiscountError(data.error || (isHe ? 'קוד לא תקין' : 'Invalid code'));
      }
    } catch {
      setDiscountError(isHe ? 'שגיאה בבדיקת הקוד' : 'Error validating code');
    } finally {
      setDiscountLoading(false);
    }
  };

  const set = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.firstName.trim()) e.firstName = isHe ? 'שם פרטי הוא שדה חובה' : 'First name is required';
    if (!form.lastName.trim()) e.lastName = isHe ? 'שם משפחה הוא שדה חובה' : 'Last name is required';
    if (!form.phone.trim()) e.phone = isHe ? 'טלפון הוא שדה חובה' : 'Phone is required';
    else if (!/^[\d\-+() ]{7,15}$/.test(form.phone.trim())) e.phone = isHe ? 'מספר טלפון לא תקין' : 'Invalid phone number';
    if (!form.email.trim()) e.email = isHe ? 'אימייל הוא שדה חובה' : 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = isHe ? 'כתובת אימייל לא תקינה' : 'Invalid email address';
    if (!form.country.trim()) e.country = isHe ? 'מדינה היא שדה חובה' : 'Country is required';
    if (!form.city.trim()) e.city = isHe ? 'עיר היא שדה חובה' : 'City is required';
    if (!form.street.trim()) e.street = isHe ? 'רחוב הוא שדה חובה' : 'Street is required';
    if (!form.zip.trim()) e.zip = isHe ? 'מיקוד הוא שדה חובה' : 'Zip code is required';
    else if (!/^[a-zA-Z0-9][a-zA-Z0-9\- ]{1,11}$/.test(form.zip.trim())) e.zip = isHe ? 'מיקוד לא תקין' : 'Invalid postal code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveOrder = useCallback(
    async (options: {
      paymentIntentId?: string;
      paypalOrderId?: string;
      method: PaymentMethod;
      bitSenderDetails?: BitSenderDetails;
    }) => {
      try {
        const isBit = options.method === 'bit';
        // credit-card goes through PayPal gateway, so map to 'paypal' for backend
        const backendMethod = options.method === 'credit-card' ? 'paypal' : options.method;
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            shippingInfo: {
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              email: form.email,
              country: form.country,
              city: form.city,
              street: form.street,
              zip: form.zip,
              notes: form.notes,
              billingCountry: sameAsBilling ? form.country : form.billingCountry,
              billingCity: sameAsBilling ? form.city : form.billingCity,
              billingStreet: sameAsBilling ? form.street : form.billingStreet,
              billingZip: sameAsBilling ? form.zip : form.billingZip,
            },
            paymentMethod: backendMethod,
            paymentStatus: isBit ? 'pending' : 'completed',
            paymentIntentId: options.paymentIntentId,
            paypalOrderId: options.paypalOrderId,
            bitSenderDetails: options.bitSenderDetails,
            subtotal,
            shipping: shippingCost,
            discountCode: discountApplied?.code || '',
            discountAmount,
            total: finalTotal,
            currency: CURRENCY_CODE,
            // Per-shipment-source legs (second-hand from Israel vs. supplier from abroad).
            // Only sent when the order ships in two parts — the server rebuilds
            // everything from items when this is absent, so legacy single-source
            // orders are unaffected.
            shipmentLegs: hasSplit
              ? legs.map((leg) => ({
                  source: leg.source,
                  itemJerseyIds: leg.items.map((i) => i.jerseyId),
                  itemCount: leg.itemCount,
                  subtotal: leg.subtotal,
                  shipping: leg.shipping,
                }))
              : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save order');
        }

        return await response.json();
      } catch (error) {
        console.error('Error saving order:', error);
        throw error;
      }
    },
    [items, form, subtotal, shippingCost, discountApplied, discountAmount, finalTotal, sameAsBilling, hasSplit, legs]
  );

  const handlePaymentSuccess = useCallback(
    async (paymentIntentId?: string, paypalOrderId?: string) => {
      setSubmitting(true);
      try {
        const result = await saveOrder({ paymentIntentId, paypalOrderId, method: paymentMethod });
        const orderId = result?.orderId;
        if (!orderId) throw new Error('Order saved but no ID returned');
        clearCart();
        clearAbandonedCart();
        // Clear exit-intent discount code after successful use
        if (typeof window !== 'undefined') localStorage.removeItem('exit_discount_code');
        router.push(`/${locale}/order-confirmed?orderId=${orderId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save order';
        setPaymentError(message);
        toast({ title: message, variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
    [saveOrder, clearCart, router, locale, paymentMethod, setPaymentError, toast]
  );

  const handleBitConfirm = useCallback(
    async (senderDetails: BitSenderDetails) => {
      setSubmitting(true);
      try {
        const result = await saveOrder({ method: 'bit', bitSenderDetails: senderDetails });
        const orderId = result?.orderId;
        if (!orderId) throw new Error('Order saved but no ID returned');
        clearCart();
        clearAbandonedCart();
        if (typeof window !== 'undefined') localStorage.removeItem('exit_discount_code');
        router.push(`/${locale}/order-confirmed?orderId=${orderId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save order';
        setPaymentError(message);
        toast({ title: message, variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
    [saveOrder, clearCart, router, locale, setPaymentError, toast]
  );

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast({
        title: isHe ? 'נא למלא את כל השדות' : 'Please fill all required fields',
        variant: 'error',
      });
      return;
    }

    setPaymentError('');
    setShowPaymentForm(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isHe]);


  const inputClass = 'w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:ring-1';
  const inputStyle = (hasError: boolean) => ({
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? '#FF4D6D' : 'var(--border)'}`,
    direction: (isRtl ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5" style={{ color: 'var(--gold)' }} />
        <h2 className="text-lg font-bold text-white font-playfair">
          {isHe ? 'פרטי הזמנה' : 'Checkout'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* First Name + Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'שם פרטי *' : 'First Name *'}
            </label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder={isHe ? 'ישראל' : 'John'}
              className={inputClass}
              style={inputStyle(!!errors.firstName)}
            />
            {errors.firstName && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'שם משפחה *' : 'Last Name *'}
            </label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder={isHe ? 'ישראלי' : 'Doe'}
              className={inputClass}
              style={inputStyle(!!errors.lastName)}
            />
            {errors.lastName && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.lastName}</p>}
          </div>
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'טלפון *' : 'Phone *'}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="050-123-4567"
              className={inputClass}
              style={{ ...inputStyle(!!errors.phone), direction: 'ltr' }}
            />
            {errors.phone && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'אימייל *' : 'Email *'}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              onBlur={() => {
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                  saveAbandonedCartData(getOrCreateSessionId(), form.email.trim(), items, locale);
                }
              }}
              placeholder="email@example.com"
              className={inputClass}
              style={{ ...inputStyle(!!errors.email), direction: 'ltr' }}
            />
            {errors.email && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.email}</p>}
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isHe ? 'מדינה *' : 'Country *'}
          </label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder={isHe ? 'ישראל' : 'Israel'}
            className={inputClass}
            style={inputStyle(!!errors.country)}
          />
          {errors.country && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.country}</p>}
        </div>

        {/* City + Zip */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'עיר *' : 'City *'}
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder={isHe ? 'תל אביב' : 'Tel Aviv'}
              className={inputClass}
              style={inputStyle(!!errors.city)}
            />
            {errors.city && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.city}</p>}
          </div>
          <div className="sm:w-32">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'מיקוד *' : 'Zip Code *'}
            </label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => set('zip', e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10))}
              placeholder="6100000"
              maxLength={10}
              className={inputClass}
              style={{ ...inputStyle(!!errors.zip), direction: 'ltr' }}
            />
            {errors.zip && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.zip}</p>}
          </div>
        </div>

        {/* Street */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isHe ? 'רחוב *' : 'Street *'}
          </label>
          <input
            type="text"
            value={form.street}
            onChange={(e) => set('street', e.target.value)}
            placeholder={isHe ? 'רחוב הרצל 1' : '1 Herzl St'}
            className={inputClass}
            style={inputStyle(!!errors.street)}
          />
          {errors.street && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.street}</p>}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isHe ? 'הערות' : 'Notes'}
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder={isHe ? 'הערות נוספות להזמנה...' : 'Additional notes...'}
            rows={3}
            className={`${inputClass} resize-none`}
            style={inputStyle(false)}
          />
        </div>

        {/* Billing address */}
        <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => setSameAsBilling(e.target.checked)}
              className="w-4 h-4 rounded accent-[var(--gold)]"
            />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'כתובת חיוב זהה לכתובת משלוח' : 'Billing address same as shipping'}
            </span>
          </label>
        </div>

        {!sameAsBilling && (
          <div className="space-y-4 pt-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {isHe ? 'כתובת חיוב' : 'Billing Address'}
            </p>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {isHe ? 'מדינה *' : 'Country *'}
              </label>
              <input type="text" value={form.billingCountry} onChange={(e) => set('billingCountry', e.target.value)} placeholder={isHe ? 'ישראל' : 'Israel'} className={inputClass} style={inputStyle(false)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {isHe ? 'עיר *' : 'City *'}
                </label>
                <input type="text" value={form.billingCity} onChange={(e) => set('billingCity', e.target.value)} placeholder={isHe ? 'תל אביב' : 'Tel Aviv'} className={inputClass} style={inputStyle(false)} />
              </div>
              <div className="sm:w-32">
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  {isHe ? 'מיקוד' : 'Zip'}
                </label>
                <input type="text" value={form.billingZip} onChange={(e) => set('billingZip', e.target.value.replace(/\D/g, '').slice(0, 7))} placeholder="6100000" maxLength={7} className={inputClass} style={{ ...inputStyle(false), direction: 'ltr' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {isHe ? 'רחוב *' : 'Street *'}
              </label>
              <input type="text" value={form.billingStreet} onChange={(e) => set('billingStreet', e.target.value)} placeholder={isHe ? 'רחוב הרצל 1' : '1 Herzl St'} className={inputClass} style={inputStyle(false)} />
            </div>
          </div>
        )}

        {/* Discount code */}
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            placeholder={isHe ? 'קוד הנחה' : 'Discount code'}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[rgba(200,162,75,0.3)]"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
            disabled={!!discountApplied}
          />
          {discountApplied ? (
            <button
              type="button"
              onClick={() => { setDiscountApplied(null); setDiscountCode(''); }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              style={{ border: '1px solid var(--border)' }}
            >
              {isHe ? 'הסר' : 'Remove'}
            </button>
          ) : (
            <button
              type="button"
              onClick={applyDiscount}
              disabled={discountLoading || !discountCode.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-black transition-colors disabled:opacity-50 flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--gold)' }}
            >
              {discountLoading
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>{isHe ? 'בודק...' : '...'}</span></>
                : (isHe ? 'החל' : 'Apply')}
            </button>
          )}
        </div>
        {discountError && (
          <p className="text-xs" style={{ color: '#FF4D6D' }}>{discountError}</p>
        )}
        {discountApplied && (
          <p className="text-xs" style={{ color: 'var(--gold)' }}>
            {isHe ? `קוד ${discountApplied.code} הוחל!` : `Code ${discountApplied.code} applied!`}
          </p>
        )}

        {/* Order summary mini */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}
        >
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'סה"כ מוצרים' : 'Subtotal'} ({itemCount} {isHe ? 'פריטים' : 'items'})
            </span>
            <span className="text-white font-semibold">{CURRENCY}{subtotal}</span>
          </div>
          {discountApplied && (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--gold)' }}>
                {isHe ? 'הנחה' : 'Discount'} ({discountApplied.code})
              </span>
              <span style={{ color: 'var(--gold)' }}>-{CURRENCY}{discountAmount}</span>
            </div>
          )}
          {hasSplit ? (
            legs.map((leg) => {
              const L = SHIPMENT_LEG_LABELS[leg.source][isHe ? 'he' : 'en'];
              const label = isHe
                ? (leg.source === 'local' ? 'משלוח · יד שנייה' : 'משלוח · חולצות חדשות')
                : (leg.source === 'local' ? 'Shipping · Second Hand' : 'Shipping · New Jerseys');
              return (
                <div key={leg.source} className="flex justify-between text-sm" title={L.sub}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color: leg.freeShipping ? 'var(--gold)' : 'var(--text-secondary)' }}>
                    {leg.freeShipping ? (isHe ? 'חינם!' : 'Free!') : `${CURRENCY}${leg.shipping}`}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-secondary)' }}>{isHe ? 'משלוח' : 'Shipping'}</span>
              <span style={{ color: freeShipping ? 'var(--gold)' : 'var(--text-secondary)' }}>
                {freeShipping ? (isHe ? 'חינם!' : 'Free!') : `${CURRENCY}${PRICES.shippingFlat}`}
              </span>
            </div>
          )}
          <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="font-bold text-white">{isHe ? 'סה"כ' : 'Total'}</span>
            <span className="text-lg font-bold" style={{ color: 'var(--cta)' }}>
              {CURRENCY}{finalTotal}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        {!showPaymentForm && (
          <>
            <PaymentMethodSelector
              selected={paymentMethod}
              onSelect={setPaymentMethod}
              isHe={isHe}
              isRtl={isRtl}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 rounded-xl font-bold text-base text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: 'var(--cta)' }}
              onMouseEnter={(e) => {
                if (!submitting) (e.currentTarget as HTMLElement).style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Package className="w-5 h-5" />
                  {isHe ? 'המשך לתשלום' : 'Proceed to Payment'}
                </>
              )}
            </button>
          </>
        )}

        {/* Payment Form (PayPal or BIT) */}
        {showPaymentForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowPaymentForm(false);
                  setSubmitting(false);
                  setPaymentError('');
                }}
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                &larr; {isHe ? 'חזור' : 'Back'}
              </button>
            </div>

            {paymentError && (
              <div
                className="p-3 rounded-lg flex items-start gap-2"
                style={{ backgroundColor: 'rgba(255,77,109,0.1)' }}
              >
                <AlertCircle
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: '#FF4D6D' }}
                />
                <p className="text-sm" style={{ color: '#FF4D6D' }}>
                  {paymentError}
                </p>
              </div>
            )}

            {paymentMethod === 'bit' ? (
              <BitPayment
                amount={finalTotal}
                isHe={isHe}
                isRtl={isRtl}
                onConfirm={handleBitConfirm}
                loading={submitting}
              />
            ) : (
              <PayPalPayment
                amount={finalTotal}
                isHe={isHe}
                isRtl={isRtl}
                fundingSource={paymentMethod === 'credit-card' ? 'card' : 'paypal'}
                shippingAddress={{
                  firstName: form.firstName,
                  lastName: form.lastName,
                  street: form.street,
                  city: form.city,
                  zip: form.zip,
                  country: form.country,
                  phone: form.phone,
                  email: form.email,
                }}
                onSuccess={(orderId) => handlePaymentSuccess(undefined, orderId)}
                onError={setPaymentError}
              />
            )}
          </motion.div>
        )}

        {/* Secure note */}
        <p
          className="text-center text-xs flex items-center justify-center gap-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          <CreditCard className="w-3.5 h-3.5" />
          {isHe ? 'תשלום מאובטח' : 'Secure checkout'}
        </p>
      </div>
    </div>
  );
}

// ─── Main Cart Page ─────────────────────────────────────────────────────────

export function CartPageClient() {
  const { locale, isRtl } = useLocale();
  const hydrated = useHydration();
  const isHe = locale === 'he';

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { toast } = useToast();

  const hasItems = hydrated && items.length > 0;
  const split = useMemo(() => splitCart(hydrated ? items : []), [items, hydrated]);
  const { itemCount, hasSplit, legs } = split;
  const freeShipping = hasSplit
    ? legs.every((l) => l.freeShipping)
    : itemCount >= SHIPPING_POLICY.freeShippingMinItems;
  const remaining = SHIPPING_POLICY.freeShippingMinItems - itemCount;

  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const breadcrumbs = [
    { label: isHe ? 'בית' : 'Home', href: `/${locale}` },
    { label: isHe ? 'עגלת קניות' : 'Cart' },
  ];

  const handleClearCart = () => {
    clearCart();
    toast({ title: isHe ? 'העגלה רוקנה' : 'Cart cleared', variant: 'info' });
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--ink)' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--steel)' }} />
          <div className="mt-8 h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--steel)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white font-playfair" style={{ letterSpacing: '-0.02em' }}>
            {isHe ? 'עגלת קניות' : 'Shopping Cart'}
            {hasItems && (
              <span className="text-base font-normal ms-2" style={{ color: 'var(--text-muted)' }}>
                ({itemCount} {isHe ? 'פריטים' : 'items'})
              </span>
            )}
          </h1>
          {hasItems && (
            <button
              onClick={handleClearCart}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FF4D6D'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >
              <Trash2 className="w-4 h-4" />
              {isHe ? 'נקה עגלה' : 'Clear Cart'}
            </button>
          )}
        </div>

        {hasItems ? (
          <>
            {/* Free shipping bar */}
            {!freeShipping && (
              <Reveal>
                <div
                  className="rounded-xl p-4 mb-6 flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(200,162,75,0.04)', border: '1px solid rgba(200,162,75,0.15)' }}
                >
                  <Truck className="w-5 h-5 shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {isHe
                        ? `הוסף עוד ${remaining} חולצ${remaining === 1 ? 'ה' : 'ות'} למשלוח חינם`
                        : `Add ${remaining} more jersey${remaining === 1 ? '' : 's'} for free shipping`}
                    </p>
                    <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(itemCount / SHIPPING_POLICY.freeShippingMinItems) * 100}%`, backgroundColor: 'var(--cta)' }}
                      />
                    </div>
                  </div>
                </div>
              </Reveal>
            )}
            {freeShipping && (
              <Reveal>
                <div
                  className="rounded-xl p-4 mb-6 flex items-center gap-3"
                  style={{ backgroundColor: 'rgba(200,162,75,0.06)', border: '1px solid rgba(200,162,75,0.25)' }}
                >
                  <Truck className="w-5 h-5 shrink-0" style={{ color: 'var(--gold)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--gold)' }}>
                    {isHe ? 'משלוח חינם על ההזמנה שלך!' : 'Free shipping on your order!'}
                  </p>
                </div>
              </Reveal>
            )}

            {/* Split shipment notice — explains why two shipping lines appear */}
            {hasSplit && (
              <Reveal>
                <div
                  className="rounded-xl p-4 mb-6 flex items-start gap-3"
                  style={{ backgroundColor: 'rgba(200,162,75,0.06)', border: '1px solid rgba(200,162,75,0.22)' }}
                  role="status"
                >
                  <Truck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                      {isHe ? SPLIT_SHIPMENT_NOTICE.he.title : SPLIT_SHIPMENT_NOTICE.en.title}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {isHe ? SPLIT_SHIPMENT_NOTICE.he.body : SPLIT_SHIPMENT_NOTICE.en.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Two-column layout */}
            <div className="lg:flex lg:gap-8">
              {/* Left: Cart items — grouped by shipment leg when mixed */}
              <div className="lg:w-[60%]">
                {hasSplit ? (
                  <div className="space-y-6">
                    {legs.map((leg) => {
                      const L = SHIPMENT_LEG_LABELS[leg.source][isHe ? 'he' : 'en'];
                      return (
                        <section key={leg.source} aria-labelledby={`leg-${leg.source}`}>
                          <header className="mb-2 flex items-baseline justify-between gap-3">
                            <h2
                              id={`leg-${leg.source}`}
                              className="text-sm font-semibold uppercase tracking-wider"
                              style={{ color: 'var(--gold)', letterSpacing: '0.08em' }}
                            >
                              {L.title}
                            </h2>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {leg.itemCount} {isHe ? 'פריטים' : `item${leg.itemCount === 1 ? '' : 's'}`}
                            </span>
                          </header>
                          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{L.sub}</p>
                          <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                              {leg.items.map((item) => (
                                <CartItemCard key={`${item.jerseyId}-${item.size}-${item.customization?.customName ?? ''}-${item.customization?.customNumber ?? ''}-${item.customization?.hasPatch ? '1' : '0'}-${item.customization?.hasPants ? '1' : '0'}-${item.customization?.isPlayerVersion ? '1' : '0'}`} item={item} />
                              ))}
                            </AnimatePresence>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {items.map((item) => (
                        <CartItemCard key={`${item.jerseyId}-${item.size}-${item.customization?.customName ?? ''}-${item.customization?.customNumber ?? ''}-${item.customization?.hasPatch ? '1' : '0'}-${item.customization?.hasPants ? '1' : '0'}-${item.customization?.isPlayerVersion ? '1' : '0'}`} item={item} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Continue shopping link */}
                <Link
                  href={`/${locale}/discover`}
                  className="inline-flex items-center gap-2 mt-6 text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                >
                  <BackArrow className="w-4 h-4" />
                  {isHe ? 'המשך לקנות' : 'Continue Shopping'}
                </Link>
              </div>

              {/* Right: Checkout */}
              <div className="lg:w-[40%] mt-8 lg:mt-0">
                <div
                  className="rounded-xl p-6 lg:sticky lg:top-24"
                  style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
                >
                  <CheckoutSection
                    isHe={isHe}
                    isRtl={isRtl}
                    split={split}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center gap-5 py-20 text-center"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              <ShoppingBag className="w-9 h-9" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white mb-1">
                {isHe ? 'העגלה ריקה' : 'Your cart is empty'}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {isHe ? 'הוסף חולצות כדי להתחיל' : 'Add jerseys to get started'}
              </p>
            </div>
            <Link
              href={`/${locale}/discover`}
              className="mt-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200"
              style={{ backgroundColor: 'var(--cta)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            >
              {isHe ? 'גלה חולצות' : 'Discover Jerseys'}
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
