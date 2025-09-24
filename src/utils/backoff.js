// Generic exponential backoff with jitter
// fn: () => Promise<any>
// options: { retries: number, base: number }
export async function backoff(fn, { retries = 2, base = 400 } = {}) {
  let attempt = 0; let lastErr;
  while (attempt <= retries) {
    try { return await fn(); } catch (e) {
      lastErr = e; attempt += 1; if (attempt > retries) break;
      const delay = base * Math.pow(2, attempt - 1) + Math.random() * 120;
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export default backoff;