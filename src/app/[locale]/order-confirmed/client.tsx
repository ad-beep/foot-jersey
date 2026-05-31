// src/app/[locale]/order-confirmed/client.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocale } from '@/hooks/useLocale';
import { SITE_NAME } from '@/lib/constants';
import { Loader2, CheckCircle2, Clock, ShoppingBag, Truck } from 'lucide-react';
import { Recommendations } from '@/components/product/Recommendations';
import type { Jersey } from '@/types';

interface OrderItem {
  jerseyId: string;
  teamName: string;
  imageUrl: string;
  size: string;
  quantity: number;
  totalPrice: number;
  customization?: {
    customName?: string;
    customNumber?: string;
    patchText?: string;
    isPlayerVersion?: boolean;
    hasPants?: boolean;
  };
}

interface Order {
  id: string;
  orderNumber?: number;
  items: OrderItem[];
  shippingInfo: {
    name: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    notes?: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  total: number;
  shipping: number;
  discountAmount?: number;
  discountCode?: string;
  currency: string;
  status: string;
  createdAt: Timestamp | null;
  orderGroupId?: string;
  siblingOrderId?: string;
  siblingOrderNumber?: number;
  shipmentSource?: 'local' | 'international';
}

export function OrderConfirmedClient({ allJerseys = [] }: { allJerseys?: Jersey[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale } = useLocale();
  const isHe = locale === 'he';

  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Prevent back button from returning to the payment form
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!orderId) {
      router.replace(`/${locale}`);
      return;
    }

    // We got an orderId from the /api/orders 201 response, so the order DID save
    // on the server. Firestore client-side reads can lag a bit (network, cold
    // starts, replica propagation). Keep retrying patiently rather than scaring
    // the customer — only stop after a real timeout (~30s), and only show the
    // softer "try again" screen on genuine read failures.
    let attempts = 0;
    const MAX_ATTEMPTS = 20;
    const RETRY_DELAY_MS = 1500;
    let cancelled = false;

    function tryFetch() {
      if (cancelled) return;
      attempts += 1;
      getDoc(doc(db, 'orders', orderId!))
        .then((snap) => {
          if (cancelled) return;
          if (snap.exists()) {
            setOrder({ id: snap.id, ...snap.data() } as Order);
            setLoading(false);
          } else if (attempts < MAX_ATTEMPTS) {
            setTimeout(tryFetch, RETRY_DELAY_MS);
          } else {
            setLoading(false);
            setFetchError(true);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(tryFetch, RETRY_DELAY_MS);
          } else {
            setLoading(false);
            setFetchError(true);
          }
        });
    }

    tryFetch();
    return () => {
      cancelled = true;
    };
  }, [orderId, locale, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--gold)' }} />
      </div>
    );
  }

  if (fetchError || !order) {
    const supportRef = orderId ? orderId.slice(0, 8).toUpperCase() : null;
    return (
      <div style={{ backgroundColor: 'var(--ink)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(255,190,50,0.10)', border: '2px solid rgba(255,190,50,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Clock style={{ width: 28, height: 28, color: '#FFBE32' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12, fontFamily: 'Playfair Display, Georgia, serif' }}>
            {isHe ? 'ההזמנה בטעינה' : 'Loading your order'}
          </h1>
          <p style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 20 }}>
            {isHe
              ? 'אנחנו עדיין טוענים את פרטי ההזמנה שלך. רענן את הדף בעוד רגע — אם תקבל אימייל אישור, ההזמנה נשמרה בהצלחה.'
              : 'We\'re still loading your order details. Please refresh in a moment — if you receive a confirmation email, your order is safely saved.'}
          </p>
          {supportRef && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(200,162,75,0.10)', border: '1px solid rgba(200,162,75,0.22)', borderRadius: 100, padding: '8px 20px', fontSize: 13, fontFamily: 'monospace', color: '#C8A24B', marginBottom: 24 }}>
              {isHe ? 'קוד הזמנה:' : 'Order ref:'} {supportRef}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ display: 'block', backgroundColor: 'var(--flare)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 0 24px rgba(255,77,46,0.3)' }}
            >
              {isHe ? 'רענן' : 'Refresh'}
            </button>
            <Link
              href={`/${locale}`}
              style={{ display: 'block', backgroundColor: 'transparent', color: '#555', fontSize: 13, padding: '10px', borderRadius: 12, textDecoration: 'none' }}
            >
              {isHe ? 'חזור לדף הבית' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isBit = order.paymentMethod === 'bit';
  const isPending = isBit && order.status === 'pending_bit_approval';
  const firstName = order.shippingInfo.name?.split(' ')[0] || order.shippingInfo.name;
  const orderRef = order.id.slice(0, 8).toUpperCase();

  // ── colour tokens (inline so no CSS vars needed in inline styles)
  const gold = '#C8A24B';
  const goldFaint = 'rgba(200,162,75,0.10)';
  const goldBorder = 'rgba(200,162,75,0.22)';
  const amber = '#FFBE32';
  const amberFaint = 'rgba(255,190,50,0.08)';
  const amberBorder = 'rgba(255,190,50,0.18)';

  const heroAccentBg   = isPending ? amberFaint  : goldFaint;
  const heroAccentBord = isPending ? amberBorder : goldBorder;
  const heroIconColor  = isPending ? amber        : gold;
  const sectionBg      = isPending ? amberFaint  : goldFaint;
  const sectionBord    = isPending ? amberBorder : goldBorder;
  const sectionLabel   = isPending ? amber        : gold;

  return (
    <div style={{ backgroundColor: 'var(--ink)', minHeight: '100vh', padding: '40px 16px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Nav */}
      <div style={{ maxWidth: 680, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/${locale}`} style={{ fontSize: 20, fontWeight: 800, color: '#fff', textDecoration: 'none', fontFamily: 'Playfair Display, Georgia, serif' }}>
          Foot<span style={{ color: gold }}>Jersey</span>
        </Link>
        <Link href={`/${locale}/discover`} style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>
          {isHe ? '→ המשך קנייה' : '← Continue Shopping'}
        </Link>
      </div>

      {/* Card */}
      <div style={{ maxWidth: 680, margin: '0 auto', backgroundColor: 'var(--steel)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0d1210 0%, #111113 100%)', borderBottom: '1px solid var(--border)', padding: '40px 32px 36px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: heroAccentBg, border: `2px solid ${heroAccentBord}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            {isPending
              ? <Clock style={{ width: 28, height: 28, color: amber }} />
              : <CheckCircle2 style={{ width: 28, height: 28, color: gold }} />
            }
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8, fontFamily: 'Playfair Display, Georgia, serif' }}>
            {isPending
              ? (isHe ? 'ההזמנה התקבלה!' : 'Order Received!')
              : (isHe ? 'ההזמנה אושרה!' : 'Order Confirmed!')}
          </h1>
          <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
            {isPending
              ? (isHe ? `תודה, ${firstName}! ממתינים לאישור תשלום BIT.` : `Thanks, ${firstName}! We're waiting to confirm your BIT payment.`)
              : (isHe ? `תודה, ${firstName}! התשלום בוצע בהצלחה.` : `Thanks, ${firstName}! Your payment was successful.`)}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: goldFaint, border: `1px solid ${goldBorder}`, borderRadius: 100, padding: '6px 16px', fontSize: 13, fontFamily: 'monospace', color: gold }}>
            {isHe ? 'הזמנה' : 'Order'} #{orderRef}
            {order.orderNumber && <span style={{ color: '#555' }}> · #{order.orderNumber}</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>

          {/* Email notice */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: sectionBg, border: `1px solid ${sectionBord}`, borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: isPending ? '#a07820' : '#9e8240' }}>
            <span>📧</span>
            <span>
              {isPending
                ? (isHe ? 'נשלח אליך אימייל עם פרטי ההמתנה ל-' : 'A confirmation email has been sent to ')
                : (isHe ? 'הקבלה נשלחה ל-' : 'Receipt sent to ')}
              <strong style={{ color: isPending ? amber : gold }}>{order.shippingInfo.email}</strong>
            </span>
          </div>

          {/* Split-shipment notice */}
          {order.orderGroupId && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(200,162,75,0.08)', border: '1px solid rgba(200,162,75,0.22)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
              <Truck style={{ width: 18, height: 18, color: gold, flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>
                  {isHe
                    ? `ההזמנה שלך נשלחת בשני חלקים${order.siblingOrderNumber ? ` · מקושרת להזמנה #${order.siblingOrderNumber}` : ''}`
                    : `Your order ships in two parts${order.siblingOrderNumber ? ` · linked to Order #${order.siblingOrderNumber}` : ''}`}
                </div>
                {isHe ? (
                  <>
                    {order.shipmentSource === 'local'
                      ? <>זהו קבלה של חלק יד שנייה — נשלח מהמחסן שלנו בישראל תוך <strong style={{ color: '#fff' }}>2–3 ימי עסקים</strong>. חולצות חדשות נשלחות מהספק תוך 14–21 ימי עסקים.</>
                      : <>זהו קבלה של חולצות חדשות — נשלח מהספק הבינלאומי תוך <strong style={{ color: '#fff' }}>14–21 ימי עסקים</strong>. פריטי יד שנייה נשלחים מישראל תוך 2–3 ימי עסקים.</>
                    }
                    <br />
                    <span style={{ color: '#888' }}>שילמת פעם אחת — שני החלקים כלולים. תקבל עדכון מעקב נפרד לכל משלוח.</span>
                  </>
                ) : (
                  <>
                    {order.shipmentSource === 'local'
                      ? <>This receipt covers the pre-loved items — shipping from our Israel warehouse in <strong style={{ color: '#fff' }}>2–3 business days</strong>. New jerseys ship from our supplier in 14–21 business days.</>
                      : <>This receipt covers the new jerseys — shipping from our international supplier in <strong style={{ color: '#fff' }}>14–21 business days</strong>. Pre-loved items ship from Israel in 2–3 business days.</>
                    }
                    <br />
                    <span style={{ color: '#888' }}>You paid once — both shipments are included. You&apos;ll get a separate tracking update for each.</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#444', marginBottom: 12 }}>
            {isHe ? 'פריטים' : 'Your Order'}
          </div>
          <div style={{ marginBottom: 24 }}>
            {order.items.map((item, i) => {
              const customParts: string[] = [];
              if (item.customization?.customName) customParts.push(`#${item.customization.customNumber || ''} ${item.customization.customName}`.trim());
              if (item.customization?.isPlayerVersion) customParts.push(isHe ? 'גרסת שחקן' : 'Player Version');
              if (item.customization?.patchText) customParts.push(item.customization.patchText);
              if (item.customization?.hasPants) customParts.push(isHe ? 'מכנסיים' : 'Pants');
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: i < order.items.length - 1 ? '1px solid #161616' : 'none' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: '#1a1a1a', border: '1px solid #222', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageUrl
                      ? <Image src={item.imageUrl} alt={item.teamName} width={52} height={52} sizes="52px" quality={60} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <ShoppingBag style={{ width: 22, height: 22, color: '#444' }} />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{item.teamName}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{isHe ? 'מידה' : 'Size'} {item.size} · ×{item.quantity}</div>
                    {customParts.length > 0 && (
                      <div style={{ fontSize: 12, color: gold, marginTop: 2 }}>{customParts.join(' · ')}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>₪{item.totalPrice * item.quantity}</div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', padding: '4px 0' }}>
              <span>{isHe ? 'סכום ביניים' : 'Subtotal'}</span><span style={{ fontFamily: 'monospace' }}>₪{order.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#666', padding: '4px 0' }}>
              <span>{isHe ? 'משלוח' : 'Shipping'}</span>
              <span style={{ fontFamily: 'monospace' }}>{order.shipping === 0 ? (isHe ? 'חינם 🎉' : 'FREE 🎉') : `₪${order.shipping}`}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: gold, padding: '4px 0' }}>
                <span>{isHe ? 'הנחה' : 'Discount'} {order.discountCode ? `(${order.discountCode})` : ''}</span>
                <span style={{ fontFamily: 'monospace' }}>-₪{order.discountAmount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#fff', padding: '12px 0 4px', marginTop: 8, borderTop: '1px solid #1e1e1e' }}>
              <span>{isHe ? 'סה"כ ששולם' : 'Total Paid'}</span><span style={{ fontFamily: 'monospace' }}>₪{order.total}</span>
            </div>
          </div>

          {/* Shipping + Payment two-col */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#444', marginBottom: 8 }}>{isHe ? 'כתובת משלוח' : 'Ship To'}</div>
              <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                {order.shippingInfo.name}<br />
                {order.shippingInfo.street}, {order.shippingInfo.city}<br />
                {order.shippingInfo.zip}, {order.shippingInfo.country}
              </p>
            </div>
            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#444', marginBottom: 8 }}>{isHe ? 'תשלום' : 'Payment'}</div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: goldFaint, border: `1px solid ${goldBorder}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: gold }}>
                  {isBit ? '⚡ BIT' : 'PayPal'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: isPending ? '#a07820' : '#888' }}>
                {isPending ? (isHe ? 'ממתין לאישור' : 'Awaiting approval') : (isHe ? 'אושר ונקלט' : 'Confirmed & captured')}
              </p>
            </div>
          </div>

          {/* What's next — full timeline with BIT note + pickup + help + tiktok */}
          {(() => {
            // Build the step list: BIT-pending orders start with a payment-verification step
            type Step = { text: React.ReactNode };
            const steps: Step[] = [];

            if (isBit) {
              steps.push({
                text: isHe
                  ? <><strong style={{ color: '#fff' }}>ודא שביצעת את התשלום ב-BIT</strong> — אם עוד לא העברת, פתח את אפליקציית BIT והעבר את הסכום למספר <span style={{ fontFamily: 'monospace', color: gold }}>054-682-0210</span>. תקבל אימייל קצר ברגע שנאמת את התשלום.</>
                  : <><strong style={{ color: '#fff' }}>Make sure you completed the BIT payment</strong> — if you haven&apos;t transferred yet, open BIT and send the amount to <span style={{ fontFamily: 'monospace', color: gold }}>054-682-0210</span>. You&apos;ll get a short email as soon as we verify your transfer.</>,
              });
            }

            steps.push({
              text: isHe
                ? <><strong style={{ color: '#fff' }}>נשלח תוך כשבוע</strong> — אנחנו מכינים את ההזמנה ושולחים בערך תוך שבוע. תקבל אימייל ברגע שהחבילה יוצאת לדרך.</>
                : <><strong style={{ color: '#fff' }}>Shipped in about a week</strong> — We&apos;re prepping your order and shipping within roughly a week. You&apos;ll get an email the moment it leaves our hands.</>,
            });

            steps.push({
              text: isHe
                ? <><strong style={{ color: '#fff' }}>הודעה על איסוף</strong> — תקבל הודעה עם פרטים על איך לאסוף את החבילה מנקודת האיסוף הקרובה אליך.</>
                : <><strong style={{ color: '#fff' }}>Pickup notification</strong> — You&apos;ll get a message with details on how to collect your package from your nearest pickup point.</>,
            });

            steps.push({
              text: isHe
                ? <>צריך עזרה במשהו? <a href="https://wa.me/972584140508" target="_blank" rel="noopener noreferrer" style={{ color: gold, textDecoration: 'none', fontWeight: 700 }}>פנה אלינו ב-WhatsApp</a> — אנחנו עונים מהר.</>
                : <>Need help with anything? <a href="https://wa.me/972584140508" target="_blank" rel="noopener noreferrer" style={{ color: gold, textDecoration: 'none', fontWeight: 700 }}>Message us on WhatsApp</a> — we reply fast.</>,
            });

            steps.push({
              text: isHe
                ? <>אל תשכח לעקוב אחרינו ב-<a href="https://www.tiktok.com/@foot.jerseys4" target="_blank" rel="noopener noreferrer" style={{ color: gold, textDecoration: 'none', fontWeight: 700 }}>TikTok</a> — דרופים חדשים והנחות.</>
                : <>Don&apos;t forget to follow us on <a href="https://www.tiktok.com/@foot.jerseys4" target="_blank" rel="noopener noreferrer" style={{ color: gold, textDecoration: 'none', fontWeight: 700 }}>TikTok</a> for new drops and offers.</>,
            });

            return (
              <div style={{ backgroundColor: sectionBg, border: `1px solid ${sectionBord}`, borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: sectionLabel, marginBottom: 12 }}>
                  {isHe ? 'מה הלאה' : "What's Next"}
                </div>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < steps.length - 1 ? 10 : 0 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: heroAccentBg, border: `1px solid ${heroAccentBord}`, color: heroIconColor, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>{step.text}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* CTA */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              href={`/${locale}/track-order`}
              style={{ flex: '1 1 0', minWidth: 140, textAlign: 'center', backgroundColor: 'transparent', color: gold, fontSize: 14, fontWeight: 700, padding: '12px 20px', borderRadius: 12, textDecoration: 'none', display: 'block', border: `1px solid ${goldBorder}` }}
            >
              {isHe ? 'עקוב אחר ההזמנה' : 'Track Order'}
            </Link>
            <Link
              href={`/${locale}/discover`}
              style={{ flex: '2 1 0', minWidth: 140, textAlign: 'center', backgroundColor: 'var(--flare)', color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 20px', borderRadius: 12, textDecoration: 'none', display: 'block', boxShadow: '0 0 24px rgba(255,77,46,0.3)' }}
            >
              {isHe ? 'המשך קנייה' : 'Continue Shopping'}
            </Link>
          </div>

        </div>
      </div>

      {/* ── Post-purchase cross-sell ──────────────────────────────── */}
      {allJerseys.length > 0 && order.items.length > 0 && (() => {
        const firstItemId = order.items[0].jerseyId;
        const currentJersey = allJerseys.find((j) => j.id === firstItemId);
        if (!currentJersey) return null;
        return (
          <div style={{ maxWidth: 680, margin: '32px auto 0' }}>
            <p
              style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(200,162,75,0.7)', marginBottom: 8 }}
            >
              {isHe ? 'בחירות מותאמות' : 'Curated For You'}
            </p>
            <h2
              style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, color: '#fff', marginBottom: 16, letterSpacing: '-0.03em' }}
            >
              {isHe ? 'השלם את המראה' : 'Complete the Look'}
            </h2>
            <Recommendations currentJersey={currentJersey} allJerseys={allJerseys} />
          </div>
        );
      })()}

      <div style={{ textAlign: 'center', fontSize: 12, color: '#333', marginTop: 24, paddingBottom: 8 }}>
        <Link href={`/${locale}`} style={{ color: '#444', textDecoration: 'none' }}>{SITE_NAME}</Link>
      </div>
    </div>
  );
}
