// ─── Owner cost calculation utilities ────────────────────────────────────────
// Used by admin dashboard and order detail page to calculate profit/cost.

export const USD_TO_ILS = 3.4;
export const MARKETING_PER_JERSEY = 15;   // ₪15 per jersey sold (paid to marketing person)
export const PAYPAL_RATE = 0.05;           // 5% PayPal commission
export const SHIPPING_COST_USD = 5;        // $5 per order
export const FREE_SHIPPING_MIN_ITEMS = 3;  // Free shipping when ≥3 jerseys ordered

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CostItem {
  jerseyId: string;
  teamName: string;
  size: string;
  quantity: number;
  totalPrice: number; // what the customer paid per unit
  customization?: {
    customName?: string;
    customNumber?: string;
    patchText?: string;
    isPlayerVersion?: boolean;
    hasPants?: boolean;
  };
}

export interface ProductInfo {
  type: string;
  isLongSleeve: boolean;
  teamName: string;
}

export interface ItemCostDetail {
  displayType: string;       // e.g. "Fan Edition"
  baseCostUSD: number;       // raw material cost in USD
  addOnsUSD: number;         // customization add-ons in USD (name+no, patch, size)
  totalUSD: number;          // baseCostUSD + addOnsUSD
  totalILS: number;          // totalUSD × USD_TO_ILS × quantity
  addOnLines: string[];      // human-readable add-on lines e.g. ["+ Name & Number: $2"]
  quantity: number;
}

// ─── Per-item cost breakdown ──────────────────────────────────────────────────
export function getItemCostDetail(item: CostItem, productMap: Map<string, ProductInfo>): ItemCostDetail {
  const product = productMap.get(item.jerseyId);
  const jerseyType = product?.type || 'regular';
  const isLongSleeve = product?.isLongSleeve || false;
  const isPlayer = item.customization?.isPlayerVersion === true;
  const nameLow = (item.teamName || product?.teamName || '').toLowerCase();
  const c = item.customization;

  // ── Base material cost (USD) ──────────────────────────────────
  let baseCostUSD = 8;
  let displayType = 'Fan Edition';

  if (jerseyType === 'kids') {
    baseCostUSD = 10; displayType = 'Kids Package';
  } else if (jerseyType === 'retro') {
    if (isLongSleeve) { baseCostUSD = 15; displayType = 'Retro Long Sleeve'; }
    else               { baseCostUSD = 10; displayType = 'Retro'; }
  } else if (jerseyType === 'other_products') {
    const isSocks = nameLow.includes('sock') || nameLow.includes('גרב');
    if (isSocks) { baseCostUSD = 3;  displayType = 'Socks'; }
    else          { baseCostUSD = 11; displayType = 'Adult Package'; }
  } else if (jerseyType === 'special')   { baseCostUSD = 8;  displayType = 'Special Edition'; }
  else if (jerseyType === 'drip')        { baseCostUSD = 8;  displayType = 'Drip'; }
  else if (jerseyType === 'world_cup')   { baseCostUSD = 8;  displayType = 'World Cup'; }
  else if (jerseyType === 'stussy')      { baseCostUSD = 8;  displayType = 'Stussy'; }
  else {
    // regular
    if (isPlayer && isLongSleeve)  { baseCostUSD = 15; displayType = 'Long Sleeve Player'; }
    else if (isPlayer)              { baseCostUSD = 10; displayType = 'Player'; }
    else if (isLongSleeve)          { baseCostUSD = 14; displayType = 'Long Sleeve Fan'; }
    else                            { baseCostUSD = 8;  displayType = 'Fan Edition'; }
  }

  // ── Add-ons (USD) ─────────────────────────────────────────────
  let addOnsUSD = 0;
  const addOnLines: string[] = [];

  const hasNameNum =
    (c?.customName && c.customName !== 'false') ||
    (c?.customNumber && c.customNumber !== 'false');
  if (hasNameNum) {
    addOnsUSD += 2;
    const parts = [c?.customName && c.customName !== 'false' ? c.customName : null,
                   c?.customNumber && c.customNumber !== 'false' ? `#${c.customNumber}` : null]
      .filter(Boolean).join(' ');
    addOnLines.push(`+ Name/Number (${parts}): $2`);
  }

  if (c?.patchText && c.patchText !== 'false') {
    addOnsUSD += 1;
    addOnLines.push(`+ Patch (${c.patchText}): $1`);
  }

  if (item.size === '3XL') { addOnsUSD += 1; addOnLines.push('+ Size 3XL: $1'); }
  if (item.size === '4XL') { addOnsUSD += 2; addOnLines.push('+ Size 4XL: $2'); }

  const totalUSD = baseCostUSD + addOnsUSD;
  const qty = item.quantity || 1;
  const totalILS = totalUSD * USD_TO_ILS * qty;

  return { displayType, baseCostUSD, addOnsUSD, totalUSD, totalILS, addOnLines, quantity: qty };
}

// ─── Full order cost summary ──────────────────────────────────────────────────
export interface OrderCostSummary {
  itemDetails: ItemCostDetail[];
  productCostILS: number;     // sum of all item material+addon costs
  shippingCostILS: number;    // $5 × 3.4 if <3 jerseys, else 0
  shippingFree: boolean;
  totalJerseys: number;
  marketingILS: number;       // totalJerseys × 15
  paypalCommissionILS: number; // 5% of order total if PayPal, else 0
  totalCostILS: number;
  revenueILS: number;         // order.total (what customer paid)
  profitILS: number;
}

export function calcOrderCost(
  items: CostItem[],
  orderTotal: number,
  paymentMethod: string,
  productMap: Map<string, ProductInfo>,
): OrderCostSummary {
  const itemDetails = items.map((item) => getItemCostDetail(item, productMap));
  const productCostILS = itemDetails.reduce((s, d) => s + d.totalILS, 0);
  const totalJerseys = items.reduce((s, i) => s + (i.quantity || 1), 0);

  const shippingFree = totalJerseys >= FREE_SHIPPING_MIN_ITEMS;
  const shippingCostILS = shippingFree ? 0 : SHIPPING_COST_USD * USD_TO_ILS;

  const marketingILS = totalJerseys * MARKETING_PER_JERSEY;
  const paypalCommissionILS = paymentMethod === 'paypal' ? orderTotal * PAYPAL_RATE : 0;

  const totalCostILS = productCostILS + shippingCostILS + marketingILS + paypalCommissionILS;
  const profitILS = orderTotal - totalCostILS;

  return {
    itemDetails,
    productCostILS,
    shippingCostILS,
    shippingFree,
    totalJerseys,
    marketingILS,
    paypalCommissionILS,
    totalCostILS,
    revenueILS: orderTotal,
    profitILS,
  };
}
