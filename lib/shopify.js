import { get } from './http.js';

export async function verifyShopify(domain) {
  const base = `https://${domain}`;

  const prod = await get(`${base}/products.json?limit=250`);
  if (!prod?.json?.products || !Array.isArray(prod.json.products)) return null;

  const productCount = prod.json.products.length;

  let currency = null;
  const meta = await get(`${base}/meta.json`);
  if (meta?.json?.currency) currency = meta.json.currency;

  return { domain, productCount, currency };
}