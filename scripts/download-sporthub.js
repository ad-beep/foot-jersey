/**
 * download-sporthub.js
 *
 * Downloads all current products from Sporthub's Shopify store and saves
 * them to sporthub_full.json in the same format as the original file.
 *
 * Run: node scripts/download-sporthub.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const STORE = 'sporthub-5658.myshopify.com';
const OUT   = path.join(__dirname, '..', 'sporthub_full.json');

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON: ' + e.message)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Transform Shopify API product → our sporthub_full.json format
function transform(p) {
  return {
    id:       p.id,
    title:    p.title,
    handle:   p.handle,
    type:     p.product_type || '',
    tags:     Array.isArray(p.tags)
                ? p.tags
                : (p.tags || '').split(',').map(t => t.trim()).filter(Boolean),
    images:   (p.images || []).map(img => img.src || img).filter(Boolean),
    variants: (p.variants || []).map(v => ({
      title: v.title,
      price: v.price,
      sku:   v.sku || null,
    })),
  };
}

async function main() {
  console.log('=== Download Sporthub Catalogue ===\n');
  console.log(`Store: ${STORE}`);
  console.log(`Output: ${OUT}\n`);

  const all = [];
  let page = 1;

  while (true) {
    const url = `https://${STORE}/products.json?limit=250&page=${page}`;
    process.stdout.write(`Fetching page ${page}...`);

    let json;
    try {
      json = await get(url);
    } catch (err) {
      console.error('\nFetch error:', err.message);
      process.exit(1);
    }

    const products = json.products || [];
    if (products.length === 0) {
      console.log(' done (no more products)');
      break;
    }

    products.forEach(p => all.push(transform(p)));
    console.log(` got ${products.length} (total so far: ${all.length})`);

    if (products.length < 250) {
      // Last page — fewer than limit means no more
      break;
    }

    page++;
    // Be polite — small delay between pages
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`\nTotal products downloaded: ${all.length}`);

  fs.writeFileSync(OUT, JSON.stringify(all, null, 2), 'utf8');
  console.log(`Saved to: ${OUT}`);
  console.log('\nNext step: run the remove-broken-images script to sync to Google Sheets,');
  console.log('or manually update products via the admin panel.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
