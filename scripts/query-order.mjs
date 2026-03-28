// Query PayPal Transaction Search API for March 27 2026 transaction of ~323 ILS
// Also check Firestore via a temporary public-read workaround
// Run: node scripts/query-order.mjs

const PAYPAL_CLIENT_ID     = 'AajKIrPlpGEIh7jhCqxlw31AUqP80bSGap-IlsqqP-KVzb3rQe7KJCMoV8NCR4FAg246sQ7Bzfae2SUB';
const PAYPAL_CLIENT_SECRET = 'EGXKVCpjf9PBwOoyJB8rc2ThiHCofLLDvoaoznYNP1mqrnJJWHhY9yp-Bhek8z-2QBYwTGPmKg69otJf';
const PAYPAL_API           = 'https://api-m.paypal.com';

// ── PayPal auth ───────────────────────────────────────────────────────────
async function getPayPalToken() {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const d = await res.json();
  if (!d.access_token) throw new Error('PayPal auth failed: ' + JSON.stringify(d));
  return d.access_token;
}

// ── PayPal Transaction Search ─────────────────────────────────────────────
async function searchTransactions(token, startDate, endDate) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date:   endDate,
    fields:     'all',
    page_size:  '100',
    page:       '1',
  });
  const res = await fetch(`${PAYPAL_API}/v1/reporting/transactions?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const d = await res.json();
  return d;
}

// ── PayPal Order Details ──────────────────────────────────────────────────
async function getOrderDetails(token, orderId) {
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ── Firestore via temporary Next.js API call ──────────────────────────────
// We'll try calling the local dev server's API if it's running
async function tryLocalAPI() {
  try {
    const res = await fetch('http://localhost:3000/api/debug-order?total=323', { signal: AbortSignal.timeout(3000) });
    if (res.ok) return res.json();
  } catch {}
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────
console.log('=== FootJersey Order Lookup: ₪323 on March 27 2026 ===\n');

// --- PayPal ---
console.log('▶ PayPal Transaction Search API');
try {
  const token = await getPayPalToken();
  console.log('  Auth: OK\n');

  // March 27 2026 full day UTC
  const result = await searchTransactions(token, '2026-03-27T00:00:00Z', '2026-03-28T00:00:00Z');

  if (result.error) {
    console.log('  API error:', JSON.stringify(result));
  } else {
    const txns = result.transaction_details || [];
    console.log(`  Total transactions on March 27: ${txns.length}`);
    if (result.total_items !== undefined) console.log(`  (API reports total_items: ${result.total_items})\n`);

    // Show all, highlight ₪323
    if (txns.length === 0) {
      console.log('  No transactions found for March 27 2026.\n');
      console.log('  Note: PayPal Transaction Search may have a reporting delay or date issue.');
      console.log('  Trying broader range (March 26-29)...');
      const wider = await searchTransactions(token, '2026-03-25T00:00:00Z', '2026-03-29T00:00:00Z');
      const allTxns = wider.transaction_details || [];
      console.log(`  Broader search: ${allTxns.length} transactions\n`);
      for (const t of allTxns) {
        const info = t.transaction_info || {};
        const payer = t.payer_info || {};
        const shipping = t.shipping_info || {};
        const amt = info.transaction_amount;
        console.log(`  ${info.transaction_initiation_date?.slice(0,19) || '?'} | ${amt?.currency_code} ${amt?.value} | ${payer.email_address || '?'} | ${payer.payer_name?.alternate_full_name || '?'}`);
      }
    } else {
      // Filter to ₪323 (ILS 323)
      const matching = txns.filter(t => {
        const amt = t.transaction_info?.transaction_amount;
        return parseFloat(amt?.value || '0') === 323;
      });

      console.log(`  Transactions with amount=323: ${matching.length}\n`);

      // Print ALL transactions from that day
      for (const t of txns) {
        const info     = t.transaction_info || {};
        const payer    = t.payer_info || {};
        const shipping = t.shipping_info || {};
        const cart     = t.cart_info || {};
        const amt      = info.transaction_amount;
        const isTarget = parseFloat(amt?.value || '0') === 323;

        if (isTarget) {
          console.log('  ═══════════════════════════════════════════════════');
          console.log(`  ✅ MATCH — ${amt?.currency_code} ${amt?.value}`);
        } else {
          console.log(`  ───────────────────────────────────────────────────`);
          console.log(`  Amount: ${amt?.currency_code} ${amt?.value}`);
        }

        console.log(`  Date:            ${info.transaction_initiation_date || '—'}`);
        console.log(`  Transaction ID:  ${info.transaction_id || '—'}`);
        console.log(`  PayPal Order ID: ${info.paypal_reference_id || '—'}`);
        console.log(`  Status:          ${info.transaction_status || '—'}`);
        console.log(`  Type:            ${info.transaction_event_code || '—'}`);
        console.log('');
        console.log(`  PAYER`);
        console.log(`  Name:            ${payer.payer_name?.alternate_full_name || [payer.payer_name?.given_name, payer.payer_name?.surname].filter(Boolean).join(' ') || '—'}`);
        console.log(`  Email:           ${payer.email_address || '—'}`);
        console.log(`  Account ID:      ${payer.account_id || '—'}`);
        console.log('');
        if (shipping.name || shipping.address) {
          console.log(`  SHIPPING ADDRESS`);
          console.log(`  Name:            ${shipping.name || '—'}`);
          const addr = shipping.address || {};
          console.log(`  Street:          ${addr.line1 || '—'}`);
          console.log(`  City:            ${addr.city || '—'}`);
          console.log(`  Postal:          ${addr.postal_code || '—'}`);
          console.log(`  Country:         ${addr.country_code || '—'}`);
          console.log('');
        }
        if (cart.item_details?.length) {
          console.log(`  CART ITEMS`);
          for (const item of cart.item_details) {
            console.log(`  • ${item.item_name || '?'} x${item.item_quantity || 1} @ ${item.item_unit_price?.value || '?'}`);
          }
          console.log('');
        }
      }

      // If we have a PayPal Order ID from a ₪323 transaction, fetch full order details
      for (const t of matching) {
        const refId = t.transaction_info?.paypal_reference_id;
        if (refId && t.transaction_info?.paypal_reference_id_type === 'ODR') {
          console.log(`  Fetching full order details for ${refId}...`);
          const order = await getOrderDetails(token, refId);
          console.log('  PayPal Order:', JSON.stringify(order, null, 2).slice(0, 2000));
        }
      }
    }
  }
} catch (e) {
  console.log('  PayPal error:', e.message);
}

console.log('\n=== Done ===');
