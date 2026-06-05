// GA4 e-commerce funnel events. These are thin wrappers over the gtag `event`
// helper, which no-ops safely when GA isn't configured. Firing the standard
// GA4 ecommerce events (view_item → add_to_cart → begin_checkout →
// add_payment_info → purchase) is what makes the funnel + abandonment reports
// work, so we can see WHERE visitors drop off.
import { event } from './gtag';
import type { CartItem, Jersey } from '@/types';

const CURRENCY = 'ILS';

interface GaItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
}

function fromJersey(jersey: Jersey, quantity = 1, price?: number): GaItem {
  return {
    item_id: jersey.id,
    item_name: jersey.teamName || jersey.nameEn || jersey.id,
    item_category: jersey.type,
    price: price ?? jersey.price,
    quantity,
  };
}

function fromCartItem(item: CartItem): GaItem {
  return {
    item_id: item.jerseyId,
    item_name: item.jersey?.teamName || item.jersey?.nameEn || item.jerseyId,
    item_category: item.jersey?.type,
    price: item.totalPrice,
    quantity: item.quantity,
  };
}

export function trackViewItem(jersey: Jersey, value?: number): void {
  event('view_item', { currency: CURRENCY, value: value ?? jersey.price, items: [fromJersey(jersey, 1, value)] });
}

export function trackAddToCart(jersey: Jersey, quantity: number, value: number): void {
  event('add_to_cart', { currency: CURRENCY, value, items: [fromJersey(jersey, quantity, value)] });
}

export function trackBeginCheckout(items: CartItem[], value: number): void {
  event('begin_checkout', { currency: CURRENCY, value, items: items.map(fromCartItem) });
}

export function trackAddPaymentInfo(value: number, paymentType: string, items?: CartItem[]): void {
  event('add_payment_info', {
    currency: CURRENCY,
    value,
    payment_type: paymentType,
    ...(items ? { items: items.map(fromCartItem) } : {}),
  });
}

export function trackPurchase(opts: {
  orderId: string;
  value: number;
  shipping?: number;
  coupon?: string;
  items: { item_id: string; item_name: string; price?: number; quantity?: number }[];
}): void {
  event('purchase', {
    transaction_id: opts.orderId,
    currency: CURRENCY,
    value: opts.value,
    ...(opts.shipping != null ? { shipping: opts.shipping } : {}),
    ...(opts.coupon ? { coupon: opts.coupon } : {}),
    items: opts.items,
  });
}
