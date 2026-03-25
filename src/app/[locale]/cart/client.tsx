'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag, Trash2, Plus, Minus, Truck, ArrowLeft, ArrowRight,
  Package, CreditCard, CheckCircle2, X, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/hooks/useLocale';
import { useHydration } from '@/hooks/useHydration';
import { useCartStore } from '@/stores/cart-store';
import { useToast } from '@/components/ui/toast';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Reveal } from '@/components/ui/reveal';
import { getJerseyName } from '@/lib/utils';
import { CURRENCY, SHIPPING_POLICY, CURRENCY_CODE } from '@/lib/constants';
import { PaymentMethodSelector, type PaymentMethod } from '@/components/payment/PaymentMethodSelector';
import { BitPayment } from '@/components/payment/BitPayment';
import { PayPalPayment } from '@/components/payment/PayPalPayment';
import { StripePayment } from '@/components/payment/StripePayment';
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
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      {/* Image */}
      <Link
        href={`/${locale}/product/${item.jerseyId}`}
        className="shrink-0 w-[88px] h-[110px] rounded-lg overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <Image
          src={item.jersey.imageUrl}
          alt={displayName}
          width={88}
          height={110}
          className="w-full h-full object-cover"
        />
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/${locale}/product/${item.jerseyId}`}
            className="text-sm font-semibold text-white line-clamp-2 hover:text-[var(--accent)] transition-colors"
          >
            {displayName}
          </Link>
          <button
            onClick={() => removeItem(item.jerseyId, item.size)}
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
            <span className="text-xs" style={{ color: 'var(--accent)' }}>
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
          <p className="text-base font-bold" style={{ color: 'var(--accent)' }}>
            {CURRENCY}{lineTotal}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateQuantity(item.jerseyId, item.size, item.quantity - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}
              aria-label={isHe ? 'הפחת' : 'Decrease'}
            >
              {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
            </button>
            <span className="text-sm font-bold text-white w-7 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.jerseyId, item.size, item.quantity + 1)}
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

// ─── Checkout Form ──────────────────────────────────────────────────────────

interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  street: string;
  zip: string;
  notes: string;
}

const EMPTY_FORM: CheckoutForm = {
  name: '', phone: '', email: '', country: '', city: '', street: '', zip: '', notes: '',
};

interface FieldError {
  name?: string;
  phone?: string;
  email?: string;
  country?: string;
  city?: string;
  street?: string;
}

function CheckoutSection({ isHe, isRtl, subtotal, itemCount }: {
  isHe: boolean;
  isRtl: boolean;
  subtotal: number;
  itemCount: number;
}) {
  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);
  const { toast } = useToast();
  const router = useRouter();
  const { locale } = useLocale();

  const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bit');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const freeShipping = itemCount >= SHIPPING_POLICY.freeShippingMinItems;

  const set = (key: keyof CheckoutForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = isHe ? 'שם הוא שדה חובה' : 'Name is required';
    if (!form.phone.trim()) e.phone = isHe ? 'טלפון הוא שדה חובה' : 'Phone is required';
    else if (!/^[\d\-+() ]{7,15}$/.test(form.phone.trim())) e.phone = isHe ? 'מספר טלפון לא תקין' : 'Invalid phone number';
    if (!form.email.trim()) e.email = isHe ? 'אימייל הוא שדה חובה' : 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = isHe ? 'כתובת אימייל לא תקינה' : 'Invalid email address';
    if (!form.country.trim()) e.country = isHe ? 'מדינה היא שדה חובה' : 'Country is required';
    if (!form.city.trim()) e.city = isHe ? 'עיר היא שדה חובה' : 'City is required';
    if (!form.street.trim()) e.street = isHe ? 'רחוב הוא שדה חובה' : 'Street is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveOrder = useCallback(
    async (paymentIntentId?: string, paypalOrderId?: string) => {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            shippingInfo: form,
            paymentMethod,
            paymentStatus: 'completed',
            paymentIntentId,
            paypalOrderId,
            subtotal,
            total: subtotal,
            currency: CURRENCY_CODE,
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
    [items, form, paymentMethod, subtotal]
  );

  const handlePaymentSuccess = useCallback(
    async (paymentIntentId?: string, paypalOrderId?: string) => {
      try {
        await saveOrder(paymentIntentId, paypalOrderId);
        setSuccess(true);
        clearCart();
        toast({
          title: isHe ? 'ההזמנה בוצעה בהצלחה!' : 'Order placed successfully!',
          variant: 'success',
        });

        setTimeout(() => {
          router.push(`/${locale}`);
        }, 3000);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save order';
        setPaymentError(message);
        toast({ title: message, variant: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
    [saveOrder, clearCart, toast, isHe, router, locale]
  );

  const handleSubmit = useCallback(async () => {
    if (!validate()) {
      toast({
        title: isHe ? 'נא למלא את כל השדות' : 'Please fill all required fields',
        variant: 'error',
      });
      return;
    }

    setSubmitting(true);
    setPaymentError('');
    setShowPaymentForm(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, isHe]);

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-4 py-12 text-center"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,195,216,0.12)' }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
        </div>
        <h3 className="text-xl font-bold text-white">
          {isHe ? 'ההזמנה בוצעה!' : 'Order Placed!'}
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isHe ? 'תודה רבה! ניצור איתך קשר בקרוב.' : "Thank you! We'll be in touch soon."}
        </p>
      </motion.div>
    );
  }

  const inputClass = 'w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-all duration-200 focus:ring-1';
  const inputStyle = (hasError: boolean) => ({
    backgroundColor: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? '#FF4D6D' : 'var(--border)'}`,
    direction: (isRtl ? 'rtl' : 'ltr') as 'rtl' | 'ltr',
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5" style={{ color: 'var(--accent)' }} />
        <h2 className="text-lg font-bold text-white">
          {isHe ? 'פרטי הזמנה' : 'Checkout'}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            {isHe ? 'שם מלא *' : 'Full Name *'}
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={isHe ? 'ישראל ישראלי' : 'John Doe'}
            className={inputClass}
            style={inputStyle(!!errors.name)}
          />
          {errors.name && <p className="text-xs mt-1" style={{ color: '#FF4D6D' }}>{errors.name}</p>}
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
          <div className="sm:w-28">
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {isHe ? 'מיקוד' : 'Zip'}
            </label>
            <input
              type="text"
              value={form.zip}
              onChange={(e) => set('zip', e.target.value)}
              placeholder="6100000"
              className={inputClass}
              style={{ ...inputStyle(false), direction: 'ltr' }}
            />
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
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>{isHe ? 'משלוח' : 'Shipping'}</span>
            <span style={{ color: freeShipping ? 'var(--accent)' : 'var(--text-secondary)' }}>
              {freeShipping ? (isHe ? 'חינם!' : 'Free!') : (isHe ? 'ייקבע בהמשך' : 'Calculated later')}
            </span>
          </div>
          <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="font-bold text-white">{isHe ? 'סה"כ' : 'Total'}</span>
            <span className="text-lg font-bold" style={{ color: 'var(--cta)' }}>{CURRENCY}{subtotal}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
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
                  {isHe ? 'בצע הזמנה' : 'Place Order'}
                </>
              )}
            </button>
          </>
        )}

        {/* Payment Form */}
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

            {paymentMethod === 'bit' && (
              <BitPayment
                amount={subtotal}
                isHe={isHe}
                isRtl={isRtl}
                onConfirm={() => handlePaymentSuccess()}
                loading={submitting}
              />
            )}

            {paymentMethod === 'paypal' && (
              <PayPalPayment
                amount={subtotal}
                isHe={isHe}
                isRtl={isRtl}
                onSuccess={(orderId) => handlePaymentSuccess(undefined, orderId)}
                onError={setPaymentError}
              />
            )}

            {paymentMethod === 'stripe' && (
              <StripePayment
                amount={subtotal}
                isHe={isHe}
                isRtl={isRtl}
                onSuccess={(paymentIntentId) =>
                  handlePaymentSuccess(paymentIntentId)
                }
                onError={setPaymentError}
                loading={submitting}
                setLoading={setSubmitting}
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
  const getItemCount = useCartStore((s) => s.getItemCount);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const { toast } = useToast();

  const itemCount = hydrated ? getItemCount() : 0;
  const subtotal = hydrated ? getSubtotal() : 0;
  const hasItems = hydrated && items.length > 0;
  const freeShipping = itemCount >= SHIPPING_POLICY.freeShippingMinItems;
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
      <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-6">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
          <div className="mt-8 h-64 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-secondary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-12" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-[1200px] mx-auto px-4 md:px-6">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
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
                  style={{ backgroundColor: 'rgba(0,195,216,0.04)', border: '1px solid var(--border)' }}
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
                  style={{ backgroundColor: 'rgba(0,195,216,0.06)', border: '1px solid rgba(0,195,216,0.2)' }}
                >
                  <Truck className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    {isHe ? 'משלוח חינם על ההזמנה שלך!' : 'Free shipping on your order!'}
                  </p>
                </div>
              </Reveal>
            )}

            {/* Two-column layout */}
            <div className="lg:flex lg:gap-8">
              {/* Left: Cart items */}
              <div className="lg:w-[60%]">
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                      <CartItemCard key={`${item.jerseyId}-${item.size}`} item={item} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Continue shopping link */}
                <Link
                  href={`/${locale}/discover`}
                  className="inline-flex items-center gap-2 mt-6 text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; }}
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
                  style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
                >
                  <CheckoutSection
                    isHe={isHe}
                    isRtl={isRtl}
                    subtotal={subtotal}
                    itemCount={itemCount}
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
