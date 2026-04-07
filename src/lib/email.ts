import nodemailer from 'nodemailer';

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shopfootjersey.com';

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
}

interface SendBitPendingOptions {
  to: string;
  customerName: string;
  orderId: string;
  total: number;
}

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
function wrapEmail(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e5e5; }
    a { color: #00c3d8; text-decoration: none; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #141414; border: 1px solid #1f1f1f; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #111 0%, #1a1a1a 100%); padding: 32px; border-bottom: 1px solid #1f1f1f; text-align: center; }
    .logo { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #fff; }
    .logo span { color: #00c3d8; }
    .body { padding: 32px; }
    .title { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .subtitle { font-size: 14px; color: #888; margin-bottom: 24px; }
    .order-id { font-family: monospace; font-size: 12px; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 8px 12px; color: #00c3d8; display: inline-block; margin-bottom: 24px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items-table th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666; padding: 8px 0; border-bottom: 1px solid #1f1f1f; }
    .items-table td { padding: 12px 0; border-bottom: 1px solid #111; font-size: 14px; color: #ccc; vertical-align: top; }
    .items-table td:last-child { text-align: right; color: #fff; font-weight: 600; }
    .item-name { color: #fff; font-weight: 600; margin-bottom: 2px; }
    .item-meta { font-size: 12px; color: #666; }
    .item-custom { font-size: 12px; color: #00c3d8; margin-top: 2px; }
    .totals { background: #0f0f0f; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .total-row { display: flex; justify-content: space-between; font-size: 14px; color: #888; padding: 4px 0; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #fff; padding-top: 12px; margin-top: 8px; border-top: 1px solid #1f1f1f; }
    .total-row.accent { color: #00c3d8; }
    .address-box { background: #0f0f0f; border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #888; line-height: 1.6; }
    .address-box h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 8px; }
    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; }
    .status-pending { background: rgba(255,190,50,0.1); color: #FFBE32; border: 1px solid rgba(255,190,50,0.2); }
    .status-success { background: rgba(0,195,216,0.1); color: #00c3d8; border: 1px solid rgba(0,195,216,0.2); }
    .info-box { border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; }
    .info-box.warning { background: rgba(255,190,50,0.06); border: 1px solid rgba(255,190,50,0.15); color: #c9a227; }
    .info-box.success { background: rgba(0,195,216,0.06); border: 1px solid rgba(0,195,216,0.15); color: #7dd3d8; }
    .cta-button { display: block; text-align: center; background: #00c3d8; color: #000 !important; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 12px; margin: 24px 0; }
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

    return `<tr>
      <td>
        <div class="item-name">${item.teamName}</div>
        <div class="item-meta">Size ${item.size} × ${item.quantity}</div>
        ${customParts.length > 0 ? `<div class="item-custom">${customParts.join(' · ')}</div>` : ''}
      </td>
      <td>₪${item.totalPrice}</td>
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

  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-success">✓ Order Confirmed</span>
      </div>
      <h1 class="title">Thank you, ${opts.customerName.split(' ')[0]}!</h1>
      <p class="subtitle">Your order has been placed and payment confirmed. We're preparing your jerseys!</p>

      <div class="order-id">Order #${opts.orderId.slice(0, 8).toUpperCase()}</div>

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
  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-pending">⏳ Awaiting Payment Confirmation</span>
      </div>
      <h1 class="title">Order Received, ${opts.customerName.split(' ')[0]}!</h1>
      <p class="subtitle">We received your BIT payment transfer request. Your order is on hold until we verify the payment.</p>

      <div class="order-id">Order #${opts.orderId.slice(0, 8).toUpperCase()}</div>

      <div class="info-box warning">
        <strong>What happens next?</strong><br><br>
        1. We verify your BIT transfer manually (usually within a few hours).<br>
        2. Once confirmed, you'll receive a <strong>second email</strong> confirming your order is being prepared.<br>
        3. Your jerseys will be shipped within 2–4 weeks after confirmation.
      </div>

      <div class="totals">
        <div class="total-row final"><span>Order Total</span><span>₪${opts.total}</span></div>
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

// ─── Order Failed + Refund Issued Email ──────────────────────────────────────
export async function sendOrderFailedRefundEmail(opts: {
  to: string;
  customerName: string;
  paypalOrderId: string;
  amount: number;
}): Promise<void> {
  const content = `
    <div class="body">
      <div style="margin-bottom:16px;">
        <span class="status-badge status-pending">⚠ Order Could Not Be Processed</span>
      </div>
      <h1 class="title">We're sorry, ${opts.customerName.split(' ')[0] || 'there'}.</h1>
      <p class="subtitle">Your payment went through, but we ran into a technical issue while creating your order. We've automatically issued a full refund.</p>

      <div class="info-box warning">
        <strong>What happened?</strong><br><br>
        Your payment of <strong>₪${opts.amount}</strong> was captured successfully, but a server error prevented your order from being recorded. <br><br>
        <strong>We have automatically refunded the full amount.</strong> Refunds typically appear on your account within 3–5 business days depending on your bank or PayPal account.
      </div>

      <div class="order-id">PayPal Reference: ${opts.paypalOrderId}</div>

      <div class="info-box success">
        <strong>What to do next:</strong><br><br>
        Please try placing your order again — everything should work now. If the problem persists, contact us via WhatsApp or reply to this email and we'll sort it out immediately.
      </div>

      <a href="${SITE_URL}/cart" class="cta-button">Try Again</a>

      <p style="font-size:12px;color:#555;text-align:center;margin-top:16px;">
        We sincerely apologize for the inconvenience. Your refund reference is: ${opts.paypalOrderId}
      </p>
    </div>`;

  try {
    await sendMail({
      to: opts.to,
      subject: 'Your order failed — Full refund issued — FootJersey',
      html: wrapEmail(content, 'Order Failed & Refunded — FootJersey'),
    });
  } catch (err) {
    console.error('[Email] Failed to send order-failed-refund email:', err);
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
