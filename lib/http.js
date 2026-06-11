const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const TIMEOUT_MS = 12_000;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function get(url, retries = 3, extraHeaders = {}) {
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/json,*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          ...extraHeaders,
        },
        redirect: 'follow',
      });
      clearTimeout(timer);

      if (res.status === 429 || res.status === 403) {
        const wait = 2 ** attempt * 2000;
        console.warn(`  [http] ${res.status} on ${url}, waiting ${wait}ms`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) return null;

      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) return { json: await res.json(), text: null, url: res.url };
      return { json: null, text: await res.text(), url: res.url };
    } catch (err) {
      clearTimeout(timer);
      if (attempt === retries - 1) return null;
      await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}