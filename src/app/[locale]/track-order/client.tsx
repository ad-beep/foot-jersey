'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { Package, Truck, CheckCircle2, Clock, ShoppingBag, Home, Plane, ExternalLink } from 'lucide-react';

interface TrackedLeg {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: number | null;
  total: number;
  currency: string;
  trackingNumber?: string;
  trackingCarrier?: string;
  shipmentSource?: 'local' | 'international';
  orderGroupId?: string;
  siblingOrderNumber?: number;
  items: Array<{ teamName: string; size: string; quantity: number }>;
}

const STATUS_ORDER = ['pending', 'pending_bit_approval', 'processing', 'shipped', 'delivered', 'completed'];

function statusStep(status: string): number {
  if (status === 'bit_declined') return -1;
  const i = STATUS_ORDER.indexOf(status);
  return i < 0 ? 0 : i;
}

function statusLabel(status: string, isHe: boolean): string {
  const map: Record<string, { en: string; he: string }> = {
    pending:              { en: 'Order received',          he: 'ההזמנה התקבלה' },
    pending_bit_approval: { en: 'Awaiting BIT approval',   he: 'ממתין לאישור BIT' },
    bit_declined:         { en: 'BIT payment declined',    he: 'תשלום BIT נדחה' },
    processing:           { en: 'Processing — being made', he: 'בהכנה — נרקם בשבילך' },
    shipped:              { en: 'Shipped — on the way',    he: 'נשלח — בדרך אליך' },
    delivered:            { en: 'Delivered',               he: 'הגיע ליעד' },
    completed:            { en: 'Completed',               he: 'הושלם' },
  };
  const item = map[status] ?? { en: status, he: status };
  return isHe ? item.he : item.en;
}

function carrierUrl(carrier?: string, tracking?: string): string | null {
  if (!carrier || !tracking) return null;
  const c = carrier.toLowerCase();
  if (c.includes('isra') || c === 'israel post' || c === 'doar') return `https://mypost.israelpost.co.il/en-us/itemtrace/?itemcode=${encodeURIComponent(tracking)}`;
  if (c.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(tracking)}`;
  if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(tracking)}`;
  if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${encodeURIComponent(tracking)}`;
  if (c.includes('china') || c.includes('ems')) return `https://track.17track.net/en/track?nums=${encodeURIComponent(tracking)}`;
  return `https://track.17track.net/en/track?nums=${encodeURIComponent(tracking)}`;
}

export function TrackOrderClient() {
  const { locale } = useLocale();
  const isHe = locale === 'he';
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [legs, setLegs] = useState<TrackedLeg[] | null>(null);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLegs(null);
    setLoading(true);
    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: Number(orderNumber), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(isHe
          ? (res.status === 404 ? 'לא מצאנו הזמנה תואמת. בדוק את המספר והאימייל.' : 'שגיאה בטעינת ההזמנה.')
          : (res.status === 404 ? "We couldn't find an order with that number and email." : 'Could not load the order.'));
        return;
      }
      setLegs(data.legs as TrackedLeg[]);
    } catch {
      setError(isHe ? 'שגיאת רשת. נסה שוב.' : 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasSplit = legs && legs.length > 1;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="py-16 md:py-24" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className={`max-w-[700px] mx-auto px-4 md:px-6 ${isHe ? 'text-right' : ''}`}>
          <p className="section-kicker mb-4">{isHe ? 'סטטוס משלוח' : 'Shipment Status'}</p>
          <h1
            className="font-playfair font-bold text-white mb-4"
            style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}
          >
            {isHe ? 'עקוב אחר ההזמנה שלך' : 'Track your order'}
          </h1>
          <p className="text-base" style={{ color: 'var(--muted)' }}>
            {isHe
              ? 'הזן את מספר ההזמנה והאימייל שבו השתמשת בעת ההזמנה.'
              : 'Enter the order number and the email you used at checkout.'}
          </p>
        </div>
      </div>

      <div className="max-w-[700px] mx-auto px-4 md:px-6 py-10">
        <form
          onSubmit={submit}
          className="rounded-2xl p-5 md:p-6 mb-8"
          style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3 md:gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                {isHe ? 'מספר הזמנה' : 'Order number'}
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="#123"
                className="w-full h-11 rounded-lg px-3 text-sm text-white outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
                {isHe ? 'אימייל' : 'Email'}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isHe ? 'האימייל שבו השתמשת' : 'you@example.com'}
                className="w-full h-11 rounded-lg px-3 text-sm text-white outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                dir={isHe ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full h-11 rounded-lg text-sm font-bold transition-colors disabled:opacity-60"
            style={{
              backgroundColor: 'var(--flare)',
              color: '#fff',
              boxShadow: '0 0 18px rgba(255,77,46,0.25)',
            }}
          >
            {loading ? (isHe ? 'מחפש…' : 'Looking up…') : (isHe ? 'מצא הזמנה' : 'Track order')}
          </button>
          {error && (
            <p className="text-xs mt-3 text-center" style={{ color: '#ff7a5c' }}>{error}</p>
          )}
        </form>

        {legs && legs.length > 0 && (
          <div className="space-y-5">
            {hasSplit && (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{ backgroundColor: 'rgba(200,162,75,0.08)', border: '1px solid rgba(200,162,75,0.22)' }}
              >
                <Truck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {isHe
                    ? 'ההזמנה שלך מפוצלת לשני משלוחים — כל חלק משודר בנפרד, עם מספר מעקב משלו.'
                    : 'Your order is split into two shipments — each ships separately with its own tracking.'}
                </p>
              </div>
            )}

            {legs.map((leg) => {
              const step = statusStep(leg.status);
              const link = carrierUrl(leg.trackingCarrier, leg.trackingNumber);
              return (
                <div
                  key={leg.id}
                  className="rounded-2xl p-5 md:p-6"
                  style={{ backgroundColor: 'var(--steel)', border: '1px solid var(--border)' }}
                >
                  <div className={`flex items-center justify-between mb-4 ${isHe ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
                      {leg.shipmentSource === 'local' ? (
                        <Home className="w-4 h-4" style={{ color: '#4ade80' }} />
                      ) : leg.shipmentSource === 'international' ? (
                        <Plane className="w-4 h-4" style={{ color: '#38bdf8' }} />
                      ) : (
                        <Package className="w-4 h-4" style={{ color: 'var(--gold)' }} />
                      )}
                      <h2 className="text-base font-bold text-white">
                        {isHe ? 'הזמנה' : 'Order'} #{leg.orderNumber}
                      </h2>
                      {leg.shipmentSource === 'local' && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.25)' }}>
                          {isHe ? 'מישראל' : 'From Israel'}
                        </span>
                      )}
                      {leg.shipmentSource === 'international' && (
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}>
                          {isHe ? 'מהספק' : 'From supplier'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>
                      {leg.currency}{leg.total}
                    </span>
                  </div>

                  {/* Progress steps */}
                  <div className="relative mb-5 px-1">
                    <div className="absolute top-3 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--border)' }} />
                    <div
                      className="absolute top-3 left-0 h-0.5 transition-all"
                      style={{
                        width: step < 0 ? '0%' : `${Math.min(100, (step / (STATUS_ORDER.length - 1)) * 100)}%`,
                        backgroundColor: step >= STATUS_ORDER.indexOf('shipped') ? '#4ade80' : 'var(--gold)',
                      }}
                    />
                    <div className={`relative flex justify-between ${isHe ? 'flex-row-reverse' : ''}`}>
                      {[
                        { key: 'pending',    icon: ShoppingBag,  label: isHe ? 'התקבל' : 'Received' },
                        { key: 'processing', icon: Clock,        label: isHe ? 'בהכנה' : 'Processing' },
                        { key: 'shipped',    icon: Truck,        label: isHe ? 'בדרך' : 'Shipped' },
                        { key: 'delivered',  icon: CheckCircle2, label: isHe ? 'הגיע'  : 'Delivered' },
                      ].map((s) => {
                        const siStep = STATUS_ORDER.indexOf(s.key);
                        const done = step >= siStep;
                        const Icon = s.icon;
                        return (
                          <div key={s.key} className="flex flex-col items-center gap-1.5" style={{ width: 56 }}>
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: done ? 'var(--gold)' : 'var(--steel)',
                                border: `1px solid ${done ? 'var(--gold)' : 'var(--border)'}`,
                                color: done ? '#000' : 'var(--muted)',
                              }}
                            >
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] font-semibold text-center" style={{ color: done ? 'var(--gold)' : 'var(--muted)' }}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Current status line */}
                  <div
                    className="rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2"
                    style={{ backgroundColor: 'rgba(200,162,75,0.08)', border: '1px solid rgba(200,162,75,0.22)' }}
                  >
                    <span className="text-sm font-semibold text-white">
                      {statusLabel(leg.status, isHe)}
                    </span>
                  </div>

                  {/* Tracking number */}
                  {leg.trackingNumber ? (
                    <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--muted)' }}>
                        {isHe ? 'מספר מעקב' : 'Tracking number'}
                        {leg.trackingCarrier && <span className="ms-2 normal-case tracking-normal font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>· {leg.trackingCarrier}</span>}
                      </p>
                      <div className={`flex items-center justify-between gap-2 ${isHe ? 'flex-row-reverse' : ''}`}>
                        <code className="text-sm font-mono text-white">{leg.trackingNumber}</code>
                        {link && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold flex items-center gap-1"
                            style={{ color: 'var(--gold)' }}
                          >
                            {isHe ? 'פתח אצל המוביל' : 'Open on carrier'}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs italic mb-4" style={{ color: 'var(--muted)' }}>
                      {isHe
                        ? 'מספר מעקב יופיע כאן כשנשלח את החבילה.'
                        : 'Tracking number will appear here once your parcel ships.'}
                    </p>
                  )}

                  {/* Items */}
                  <div className="space-y-1.5">
                    {leg.items.map((item, i) => (
                      <div key={i} className={`flex items-center justify-between text-xs ${isHe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-white">{item.teamName}</span>
                        <span style={{ color: 'var(--muted)' }}>
                          {isHe ? 'מידה' : 'Size'} {item.size} · ×{item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>
              {isHe ? 'יש שאלה? ' : 'Got a question? '}
              <Link href={`/${locale}/contact`} className="font-semibold" style={{ color: 'var(--gold)' }}>
                {isHe ? 'צור קשר' : 'Contact us'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
