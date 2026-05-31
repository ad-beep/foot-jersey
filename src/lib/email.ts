import nodemailer from 'nodemailer';
import { SITE_URL } from './constants';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  });
}

interface OrderItem {
  teamName: string;
  size: string;
  quantity: number;
  totalPrice: number;
  customization?: {
    customName?: string;
    customNumber?: string;
    hasPatch?: boolean;
    hasPants?: boolean;
    isPlayerVersion?: boolean;
  };
}

interface SendOrderConfirmationOptions {
  to: string;
  customerName: string;
  orderId: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  shipping: number;
  discountAmount?: number;
  discountCode?: string;
  shippingAddress: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  isSplit?: boolean;
  siblingOrderNumber?: number;
}

interface SendBitPendingOptions {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
  discountCode?: string;
  items?: OrderItem[];
  shippingAddress?: { street: string; city: string; zip: string; country: string };
  isSplit?: boolean;
  siblingOrderNumber?: number;
}

// ─── Unsubscribe URL helper ───────────────────────────────────────────────────
function unsubscribeUrl(email: string): string {
  const token = Buffer.from(email).toString('base64url');
  return `${SITE_URL}/api/unsubscribe?t=${token}`;
}

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
function wrapEmail(content: string, title: string, unsubUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e5; }
    a { color: #C8A24B; text-decoration: none; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #141414; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0d0d0f 0%, #141416 100%); padding: 32px; border-bottom: 1px solid #1f1f1f; text-align: center; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #fff; font-family: Georgia, 'Times New Roman', serif; }
    .logo span { color: #C8A24B; }
    .body { padding: 32px; }
    .title { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px; font-family: Georgia, 'Times New Roman', serif; }
    .subtitle { font-size: 14px; color: #888; margin-bottom: 24px; }
    .order-id { font-family: monospace; font-size: 12px; background: #1a1a1a; border: 1px solid rgba(200,162,75,0.25); border-radius: 8px; padding: 8px 12px; color: #C8A24B; display: inline-block; margin-bottom: 24px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666; padding: 8px 0; border-bottom: 1px solid #1f1f1f; }
    .items-table td { padding: 12px 0; border-bottom: 1px solid #111; font-size: 14px; color: #ccc; vertical-align: top; }
    .items-table td:last-child { text-align: right; color: #fff; font-weight: 600; font-family: monospace; }
    .item-name { color: #fff; font-weight: 600; margin-bottom: 2px; }
    .item-meta { font-size: 12px; color: #666; }
    .item-custom { font-size: 12px; color: #C8A24B; margin-top: 2px; }
    .totals { background: #0f0f0f; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; color: #888; padding: 4px 0; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #fff; padding-top: 12px; margin-top: 8px; border-top: 1px solid #1f1f1f; font-family: monospace; }
    .total-row.accent { color: #C8A24B; }
    .address-box { background: #0f0f0f; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #888; line-height: 1.6; }
    .address-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 8px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; }
    .status-pending { background: rgba(255,190,50,0.1); color: #FFBE32; border: 1px solid rgba(255,190,50,0.2); }
    .status-success { background: rgba(200,162,75,0.12); color: #C8A24B; border: 1px solid rgba(200,162,75,0.25); }
    .info-box { border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; }
    .info-box.warning { background: rgba(255,190,50,0.06); border: 1px solid rgba(255,190,50,0.15); color: #c9a227; }
    .info-box.success { background: rgba(200,162,75,0.06); border: 1px solid rgba(200,162,75,0.18); color: #b8923e; }
    .cta-button { display: block; text-align: center; background: #FF4D2E; color: #fff !important; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 12px; margin: 24px 0; }
    .footer { padding: 24px 32px; border-top: 1px solid #1a1a1a; text-align: center; }
    .footer p { font-size: 12px; color: #444; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Foot<span>Jersey</span></div>
      </div>
      ${content}
      <div class="footer">
        <p>FootJersey · <a href="${SITE_URL}">shopfootjersey.com</a></p>
        <p>Questions? Reply to this email or WhatsApp us.</p>
        ${unsubUrl ? `<p style="margin-top:8px;"><a href="${unsubUrl}" style="color:#555;font-size:11px;">Unsubscribe from marketing emails</a></p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderItems(items: OrderItem[]): string {
  return items.map((item) => {
    const customParts: string[] = [];
    if (item.customization?.customName) customParts.push(`#${item.customization.customNumber || ''} ${item.customization.customName}`);
    if (item.customization?.isPlayerVersion) customParts.push('Player Version');
    if (item.customization?.hasPatch) customParts.push('Patch');
    if (item.customization?.hasPants) customParts.push('Pants');

    const lineTotal = item.totalPrice * item.quantity;
    return `<tr>
      <td>
        <div class="item-name">${item.teamName}</div>
        <div class="item-meta">Size ${item.size} × ${item.quantity}${item.quantity > 1 ? ` (₪${item.totalPrice} each)` : ''}</div>
        ${customParts.length > 0 ? `<div class="item-custom">${customParts.join(' · ')}</div>` : ''}
      </td>
      <td>₪${lineTotal}</td>
    </tr>`;
  }).join('');
}

async function sendMail(opts: { to: string; subject: string; html: string }): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('[Email] GMAIL_USER or GMAIL_APP_PASSWORD not configured — email not sent');
  }
  const from = `FootJersey <${process.env.GMAIL_USER}>`;
  console.log(`[Email] Sending to ${opts.to} — "${opts.subject}"`);
  await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
  console.log(`[Email] Sent OK to ${opts.to}`);
}

// ─── Order Confirmation Email (PayPal/Credit Card) ────────────────────────────
export async function sendOrderConfirmation(opts: SendOrderConfirmationOptions): Promise<void> {
  const itemsHtml = renderItems(opts.items);
  const discountRow = opts.discountAmount && opts.discountAmount > 0
    ? `<div class="total-row accent"><span>Discount (${opts.discountCode || ''})</span><span>-₪${opts.discountAmount}</span></div>`
    : '';

  const splitNoticeHtml = opts.isSplit
    ? `<div class="info-box" style="background:rgba(200,162,75,0.08);border:1px solid rgba(200,162,75,0.22);color:#d4b570;margin-bottom:20px;">
        <strong style="color:#fff;">Your order ships in two parts${opts.siblingOrderNumber ? ` · linked to Order #${opts.siblingOrderNumber}` : ''}.</strong><br>
        Pre-loved items ship from our Israel warehouse in 2–3 business days; new jerseys ship from our international supplier in 14–21 business days. You paid once — both shipments are included. You'll get a separate tracking update for each.
      </div>`
    : '';

  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-success">✓ Order Confirmed</span>
      </div>
      <h1 class="title">Thank you, ${opts.customerName.split(' ')[0]}!</h1>
      <p class="subtitle">Your order has been placed and payment confirmed. We're preparing your jerseys!</p>

      <div class="order-id">Order #${opts.orderId.slice(0, 8).toUpperCase()}</div>

      ${splitNoticeHtml}

      <table class="items-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>₪${opts.subtotal}</span></div>
        <div class="total-row"><span>Shipping</span><span>${opts.shipping === 0 ? 'FREE 🎉' : '₪' + opts.shipping}</span></div>
        ${discountRow}
        <div class="total-row final"><span>Total</span><span>₪${opts.total}</span></div>
      </div>

      <div class="address-box">
        <h4>Shipping To</h4>
        <p>${opts.customerName}<br>
        ${opts.shippingAddress.street}, ${opts.shippingAddress.city}<br>
        ${opts.shippingAddress.zip}, ${opts.shippingAddress.country}</p>
      </div>

      <div class="info-box success">
        🚀 We typically ship within 2–4 weeks. You'll receive a shipping notification once your order is on its way.
      </div>

      <a href="${SITE_URL}" class="cta-button">Continue Shopping</a>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `Order Confirmed — FootJersey #${opts.orderId.slice(0, 8).toUpperCase()}`,
      html: wrapEmail(content, 'Order Confirmed — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send order confirmation:', err);
  }
}

// ─── BIT Pending Email (sent immediately on BIT order) ────────────────────────
export async function sendBitPendingEmail(opts: SendBitPendingOptions): Promise<void> {
  const itemsHtml = opts.items?.length ? `
      <table class="items-table">
        <thead><tr><th>Item</th><th style="text-align:right">Price</th></tr></thead>
        <tbody>${renderItems(opts.items)}</tbody>
      </table>` : '';

  const discountRow = opts.discountAmount && opts.discountAmount > 0
    ? `<div class="total-row accent"><span>Discount (${opts.discountCode || ''})</span><span>-₪${opts.discountAmount}</span></div>`
    : '';

  const totalsHtml = opts.subtotal !== undefined ? `
      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>₪${opts.subtotal}</span></div>
        <div class="total-row"><span>Shipping</span><span>${opts.shipping === 0 ? 'FREE 🎉' : '₪' + (opts.shipping ?? 0)}</span></div>
        ${discountRow}
        <div class="total-row final"><span>Order Total</span><span>₪${opts.total}</span></div>
      </div>` : `
      <div class="totals">
        <div class="total-row final"><span>Order Total</span><span>₪${opts.total}</span></div>
      </div>`;

  const addressHtml = opts.shippingAddress ? `
      <div class="address-box">
        <h4>Shipping To</h4>
        <p>${opts.customerName}<br>
        ${opts.shippingAddress.street}, ${opts.shippingAddress.city}<br>
        ${opts.shippingAddress.zip}, ${opts.shippingAddress.country}</p>
      </div>` : '';

  const splitNoticeHtml = opts.isSplit
    ? `<div class="info-box" style="background:rgba(200,162,75,0.08);border:1px solid rgba(200,162,75,0.22);color:#d4b570;margin-bottom:20px;">
        <strong style="color:#fff;">Your order ships in two parts${opts.siblingOrderNumber ? ` · linked to Order #${opts.siblingOrderNumber}` : ''}.</strong><br>
        Pre-loved items ship from Israel in 2–3 business days; new jerseys ship from the supplier in 14–21 business days. One payment covers both — each ships with its own tracking update.
      </div>`
    : '';

  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-pending">⏳ Awaiting Payment Confirmation</span>
      </div>
      <h1 class="title">Order Received, ${opts.customerName.split(' ')[0]}!</h1>
      <p class="subtitle">We received your BIT payment transfer request. Your order is on hold until we verify the payment.</p>

      <div class="order-id">Order #${opts.orderId.slice(0, 8).toUpperCase()}</div>

      ${splitNoticeHtml}
      ${itemsHtml}
      ${totalsHtml}
      ${addressHtml}

      <div class="info-box warning">
        <strong>What happens next?</strong><br><br>
        1. We verify your BIT transfer manually (usually within a few hours).<br>
        2. Once confirmed, you'll receive a <strong>second email</strong> confirming your order is being prepared.<br>
        3. Your jerseys will be shipped within 2–4 weeks after confirmation.
      </div>

      <p style="font-size:13px;color:#666;margin-bottom:24px;">
        If you have any questions or issues with your payment, please contact us via WhatsApp or reply to this email.
      </p>

      <a href="${SITE_URL}" class="cta-button">Back to FootJersey</a>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `Order Received — Awaiting BIT Payment — FootJersey #${opts.orderId.slice(0, 8).toUpperCase()}`,
      html: wrapEmail(content, 'Order Received — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send BIT pending email:', err);
  }
}

// ─── BIT Approved Email (sent by admin after approval) ────────────────────────
export async function sendBitApprovedEmail(opts: {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  discountAmount?: number;
  discountCode?: string;
  items?: OrderItem[];
  shippingAddress?: { street: string; city: string; zip: string; country: string };
}): Promise<void> {
  const itemsHtml = opts.items?.length ? `
      <table class="items-table">
        <thead><tr><th>Item</th><th style="text-align:right">Price</th></tr></thead>
        <tbody>${renderItems(opts.items)}</tbody>
      </table>` : '';

  const discountRow = opts.discountAmount && opts.discountAmount > 0
    ? `<div class="total-row accent"><span>Discount (${opts.discountCode || ''})</span><span>-₪${opts.discountAmount}</span></div>`
    : '';

  const totalsHtml = opts.subtotal !== undefined ? `
      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>₪${opts.subtotal}</span></div>
        <div class="total-row"><span>Shipping</span><span>${opts.shipping === 0 ? 'FREE 🎉' : '₪' + (opts.shipping ?? 0)}</span></div>
        ${discountRow}
        <div class="total-row final"><span>Total</span><span>₪${opts.total}</span></div>
      </div>` : `
      <div class="totals">
        <div class="total-row final"><span>Order Total</span><span>₪${opts.total}</span></div>
      </div>`;

  const addressHtml = opts.shippingAddress ? `
      <div class="address-box">
        <h4>Shipping To</h4>
        <p>${opts.customerName}<br>
        ${opts.shippingAddress.street}, ${opts.shippingAddress.city}<br>
        ${opts.shippingAddress.zip}, ${opts.shippingAddress.country}</p>
      </div>` : '';

  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-success">✓ Payment Confirmed</span>
      </div>
      <h1 class="title">Your order is being prepared! 🎽</h1>
      <p class="subtitle">Great news! We've confirmed your BIT payment and your order is now in production.</p>

      <div class="order-id">Order #${opts.orderId.slice(0, 8).toUpperCase()}</div>

      ${itemsHtml}
      ${totalsHtml}
      ${addressHtml}

      <div class="info-box success">
        🚀 Your jerseys are being prepared and will be shipped within 2–4 weeks. You'll receive another email with tracking info once shipped!
      </div>

      <a href="${SITE_URL}" class="cta-button">Continue Shopping</a>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `Payment Confirmed — Your Order is Being Prepared! — FootJersey`,
      html: wrapEmail(content, 'Order Being Prepared — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send BIT approved email:', err);
  }
}

// ─── Order Shipped Email (sent when admin marks order as shipped) ────────────
export async function sendOrderShippedEmail(opts: {
  to: string;
  customerName: string;
  orderId: string;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
}): Promise<void> {
  const tracking = opts.trackingNumber
    ? `<div class="order-id" style="margin-top:8px;">Tracking: ${opts.trackingCarrier ? opts.trackingCarrier + ' · ' : ''}${opts.trackingNumber}</div>`
    : '';

  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-success">📦 Your Order Has Shipped</span>
      </div>
      <h1 class="title">It's on the way, ${opts.customerName.split(' ')[0] || 'friend'}! 🚚</h1>
      <p class="subtitle">Great news — your order is out for delivery. You'll receive a separate message with details on how to pick it up from your nearest pickup point.</p>

      <div class="order-id">Order #${opts.orderId.slice(0, 8).toUpperCase()}</div>
      ${tracking}

      <div class="info-box success" style="margin-top:20px;">
        <strong>What happens next:</strong><br><br>
        1. You'll get a pickup notification with your nearest pickup point and a code.<br>
        2. Bring an ID and the code to collect your package.<br>
        3. Need help? Reply to this email or ping us on WhatsApp.
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px;">
        <a href="https://wa.me/972584140508" class="cta-button" style="flex:1;text-align:center;">💬 WhatsApp Us</a>
        <a href="https://www.tiktok.com/@foot.jerseys4" class="cta-button" style="flex:1;text-align:center;background:#000;">Follow on TikTok</a>
      </div>

      <p style="font-size:12px;color:#555;text-align:center;margin-top:20px;">
        Thanks for choosing FootJersey. We hope you love your jerseys.
      </p>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `📦 Your FootJersey order has shipped — #${opts.orderId.slice(0, 8).toUpperCase()}`,
      html: wrapEmail(content, 'Order Shipped — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send shipped email:', err);
  }
}

// ─── Abandoned Cart Reminder Email ───────────────────────────────────────────
interface AbandonedCartItem {
  name?: string;
  jerseyId?: string;
  size: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export async function sendAbandonedCartEmail(opts: {
  to: string;
  items: AbandonedCartItem[];
  locale?: string;
}): Promise<void> {
  const isHe = opts.locale === 'he';
  const cartUrl = `${SITE_URL}/${opts.locale || 'en'}/cart`;

  const itemsHtml = opts.items.length > 0
    ? `<table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead><tr>
          <th style="text-align:left;padding:8px 0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #1a1a1a;">${isHe ? 'פריט' : 'Item'}</th>
          <th style="text-align:right;padding:8px 0;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid #1a1a1a;">${isHe ? 'מחיר' : 'Price'}</th>
        </tr></thead>
        <tbody>${opts.items.map(item => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #111;">
              <div style="font-size:14px;color:#fff;font-weight:600;">${item.name || 'Jersey'}</div>
              <div style="font-size:12px;color:#666;">${isHe ? 'מידה' : 'Size'}: ${item.size} · ×${item.quantity}</div>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #111;text-align:right;font-family:monospace;color:#C8A24B;font-weight:700;">₪${(item.price * item.quantity).toFixed(0)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
    : '';

  const subject = isHe ? 'שכחת משהו בעגלה? 🛒' : "You left something behind 🛒";

  const content = `
    <div class="body">
      <h1 class="title">${isHe ? 'שכחת משהו? 🛒' : 'Still thinking about it?'}</h1>
      <p class="subtitle">${isHe
        ? 'יש לך פריטים בעגלת הקניות שלך. הם ממתינים לך — אבל לא יהיו זמינים לנצח.'
        : "You left some items in your cart. They're waiting for you — but won't be available forever."}</p>

      ${itemsHtml}

      <a href="${cartUrl}" class="cta-button">${isHe ? 'השלם את הרכישה' : 'Complete Your Order'}</a>

      <div class="info-box success" style="margin-top:20px;">
        ${isHe
          ? '🚚 משלוח חינם על 3 פריטים ומעלה · תשלום מאובטח דרך PayPal או BIT'
          : '🚚 Free shipping on 3+ items · Secure checkout with PayPal or BIT'}
      </div>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject,
      html: wrapEmail(content, isHe ? 'FootJersey — שכחת בעגלה' : 'FootJersey — Items in your cart'),
    });
  } catch (err) {
    console.error('[Email] Failed to send abandoned cart email:', err);
    throw err; // Re-throw so the cron job can track failures
  }
}

// ─── Password Reset Email ─────────────────────────────────────────────────────
export async function sendPasswordResetEmail(opts: { to: string; resetLink: string }): Promise<void> {
  const content = `
    <div class="body">
      <h1 class="title">Reset Your Password</h1>
      <p class="subtitle">We received a request to reset your FootJersey password.</p>

      <div class="info-box success" style="margin-bottom:24px;">
        Click the button below to create a new password. This link expires in <strong>1 hour</strong>.
      </div>

      <a href="${opts.resetLink}" class="cta-button">Reset My Password</a>

      <p style="font-size:12px;color:#555;text-align:center;margin-top:16px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: 'Reset Your FootJersey Password',
      html: wrapEmail(content, 'Password Reset — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send password reset email:', err);
  }
}

// ─── Marketing — Welcome Email (exit-intent lead) ─────────────────────────────
export async function sendMarketingWelcomeEmail(opts: {
  to: string;
  discountCode: string;
}): Promise<void> {
  const content = `
    <div class="body">
      <h1 class="title">Welcome to FootJersey! 🎽</h1>
      <p class="subtitle">Here's your exclusive 10% discount code — use it on any jersey.</p>

      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:rgba(200,162,75,0.12);border:2px dashed rgba(200,162,75,0.5);border-radius:16px;padding:20px 40px;">
          <p style="font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.2em;color:#888;margin-bottom:8px;">Your Discount Code</p>
          <p style="font-size:36px;font-weight:900;font-family:monospace;color:#C8A24B;letter-spacing:0.1em;margin:0;">${opts.discountCode}</p>
          <p style="font-size:12px;color:#888;margin-top:8px;">10% off your entire order · Valid 14 days</p>
        </div>
      </div>

      <div class="info-box success" style="margin-bottom:24px;">
        🚚 Free shipping on 3+ items &nbsp;·&nbsp; PayPal &amp; BIT accepted &nbsp;·&nbsp; 300+ jerseys in stock
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="33%" style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:10px;padding:12px;text-align:center;">
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">Retro Classics</p>
              <p style="font-size:11px;color:#555;margin:0;">Archive 1990–2010</p>
            </div>
          </td>
          <td width="33%" style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:10px;padding:12px;text-align:center;">
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">25/26 Season</p>
              <p style="font-size:11px;color:#555;margin:0;">New kits just dropped</p>
            </div>
          </td>
          <td width="33%" style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:10px;padding:12px;text-align:center;">
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">World Cup 2026</p>
              <p style="font-size:11px;color:#555;margin:0;">48 national teams</p>
            </div>
          </td>
        </tr>
      </table>

      <a href="${SITE_URL}" class="cta-button">Shop Now — Use ${opts.discountCode}</a>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `Your 10% discount is inside 🎽 — FootJersey`,
      html: wrapEmail(content, 'Welcome to FootJersey', unsubscribeUrl(opts.to)),
    });
  } catch (err) {
    console.error('[Email] Failed to send marketing welcome email:', err);
    throw err;
  }
}

// ─── Marketing — Day 3 Follow-up ─────────────────────────────────────────────
export async function sendMarketingDay3Email(opts: {
  to: string;
  discountCode: string;
}): Promise<void> {
  const content = `
    <div class="body">
      <h1 class="title">Still looking for your jersey? ⚽</h1>
      <p class="subtitle">Thousands of football fans have already found their perfect kit at FootJersey. Your 10% discount is still waiting for you.</p>

      <div class="order-id" style="text-align:center;">${opts.discountCode} — 10% off</div>

      <p style="font-size:13px;color:#888;margin:20px 0 12px;">Our most popular teams right now:</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">FC Barcelona</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">La Liga</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Real Madrid</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">La Liga</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Brazil</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">National Team</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Argentina</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">National Team</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">Liverpool</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">Premier League</p>
            </div>
          </td>
          <td style="padding:4px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:8px;padding:10px 14px;text-align:center;">
              <p style="font-size:12px;font-weight:700;color:#fff;margin:0;">PSG</p>
              <p style="font-size:10px;color:#555;margin:3px 0 0;">Ligue 1</p>
            </div>
          </td>
        </tr>
      </table>

      <div class="info-box success" style="margin-bottom:24px;">
        ⭐ Over 300 jerseys in stock · Retro, current &amp; World Cup kits · Ships to Israel &amp; worldwide
      </div>

      <a href="${SITE_URL}" class="cta-button">Find My Jersey — ${opts.discountCode}</a>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `Still looking for your jersey? ⚽ Your discount is waiting`,
      html: wrapEmail(content, 'Still Shopping — FootJersey', unsubscribeUrl(opts.to)),
    });
  } catch (err) {
    console.error('[Email] Failed to send marketing day-3 email:', err);
    throw err;
  }
}

// ─── Marketing — Day 7 Final Email ───────────────────────────────────────────
export async function sendMarketingDay7Email(opts: {
  to: string;
  discountCode: string;
}): Promise<void> {
  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-pending">⏰ Your discount expires soon</span>
      </div>
      <h1 class="title">Last chance — don't miss out</h1>
      <p class="subtitle">Your ${opts.discountCode} code gives you 10% off any jersey. After this, we won't contact you again.</p>

      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:rgba(200,162,75,0.12);border:2px dashed rgba(200,162,75,0.5);border-radius:16px;padding:20px 40px;">
          <p style="font-size:36px;font-weight:900;font-family:monospace;color:#C8A24B;letter-spacing:0.1em;margin:0;">${opts.discountCode}</p>
          <p style="font-size:12px;color:#888;margin-top:8px;">10% off — expires soon</p>
        </div>
      </div>

      <div class="info-box warning" style="margin-bottom:24px;">
        <strong>Why act now?</strong><br><br>
        · World Cup 2026 jerseys selling fast — 48 nations in stock<br>
        · New retro kits added every week<br>
        · 25/26 season kits available now<br>
        · Free shipping on 3+ jerseys
      </div>

      <a href="${SITE_URL}" class="cta-button">Use ${opts.discountCode} Before It Expires</a>

      <p style="font-size:12px;color:#555;text-align:center;margin-top:20px;">
        This is our last email — we respect your inbox.
      </p>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: `⏰ Last chance — your FootJersey discount expires soon`,
      html: wrapEmail(content, 'Last Chance — FootJersey', unsubscribeUrl(opts.to)),
    });
  } catch (err) {
    console.error('[Email] Failed to send marketing day-7 email:', err);
    throw err;
  }
}

// ─── Marketing — Periodic Blast ───────────────────────────────────────────────
const BLAST_SUBJECTS = [
  '⚽ New jerseys just dropped — check what\'s in stock',
  '🏆 World Cup 2026 — 48 nations ready to ship',
  '👕 Retro classics + 25/26 season kits are in',
  '🔥 Top sellers this week at FootJersey',
  '🎽 Your next jersey is waiting — shop now',
];

export async function sendMarketingBlastEmail(opts: { to: string; dayIndex: number }): Promise<void> {
  const subject = BLAST_SUBJECTS[opts.dayIndex % BLAST_SUBJECTS.length];

  const content = `
    <div class="body">
      <h1 class="title">Football jerseys for every fan ⚽</h1>
      <p class="subtitle">300+ jerseys in stock — retro classics, current season &amp; World Cup 2026.</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
        <tr>
          <td width="50%" style="padding:5px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;padding:16px;text-align:center;">
              <p style="font-size:22px;margin:0 0 8px;">🏆</p>
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">World Cup 2026</p>
              <p style="font-size:11px;color:#555;margin:0;">48 national teams in stock</p>
            </div>
          </td>
          <td width="50%" style="padding:5px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;padding:16px;text-align:center;">
              <p style="font-size:22px;margin:0 0 8px;">🕹️</p>
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">Retro Classics</p>
              <p style="font-size:11px;color:#555;margin:0;">Archive kits 1990–2010</p>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding:5px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;padding:16px;text-align:center;">
              <p style="font-size:22px;margin:0 0 8px;">✨</p>
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">25/26 Season Kits</p>
              <p style="font-size:11px;color:#555;margin:0;">Latest drops just landed</p>
            </div>
          </td>
          <td width="50%" style="padding:5px;">
            <div style="background:#111;border:1px solid #1f1f1f;border-radius:12px;padding:16px;text-align:center;">
              <p style="font-size:22px;margin:0 0 8px;">⭐</p>
              <p style="font-size:13px;font-weight:700;color:#fff;margin:0 0 4px;">Player Versions</p>
              <p style="font-size:11px;color:#555;margin:0;">Same kit as the pros</p>
            </div>
          </td>
        </tr>
      </table>

      <div class="info-box success" style="margin-bottom:24px;">
        🚚 Free shipping on 3+ jerseys &nbsp;·&nbsp; PayPal &amp; BIT accepted &nbsp;·&nbsp; Ships to Israel &amp; worldwide
      </div>

      <a href="${SITE_URL}" class="cta-button">Shop All Jerseys</a>
    </div>`;

  await sendMail({
    to: opts.to,
    subject,
    html: wrapEmail(content, 'FootJersey — New Arrivals', unsubscribeUrl(opts.to)),
  });
}
