import { useEffect, useState, useCallback, useRef } from 'react';
import { getCompanyInfo } from '../api';

// In-memory cache (module scoped)
const memoryCache = new Map(); // email -> { planMeta, timestamp }
const PLAN_LIMITS = { free: 1, silver: 5, gold: 20 };
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function computePlanMeta(company) {
  if (!company) return null;
  const plan = company.subscriptionPlan || 'free';
  const status = company.subscriptionStatus || 'inactive';
  const limit = PLAN_LIMITS[plan] ?? 0;
  const used = company.activeJobCount || 0;
  const remaining = Math.max(0, limit - used);
  const activated = company.subscriptionActivatedAt ? new Date(company.subscriptionActivatedAt) : null;
  const expires = company.subscriptionExpiresAt ? new Date(company.subscriptionExpiresAt) : null;
  const daysRemaining = expires ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / (1000*60*60*24))) : null;
  return { plan, status, limit, used, remaining, activated, expires, daysRemaining };
}

export default function usePlanMeta(email, { auto = true } = {}) {
  const [planMeta, setPlanMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef(email);
  emailRef.current = email;

  const load = useCallback(async (force = false) => {
    if (!emailRef.current) return null;
    const key = `planMeta::${emailRef.current}`;
    const now = Date.now();
    if (!force) {
      // Memory cache
      const mem = memoryCache.get(emailRef.current);
      if (mem && (now - mem.timestamp) < TTL_MS) {
        setPlanMeta(mem.planMeta);
        return mem.planMeta;
      }
      // sessionStorage cache
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.timestamp && (now - parsed.timestamp) < TTL_MS) {
            memoryCache.set(emailRef.current, { planMeta: parsed.planMeta, timestamp: parsed.timestamp });
            setPlanMeta(parsed.planMeta);
            return parsed.planMeta;
          }
        }
      } catch { /* ignore */ }
    }
    setLoading(true); setError('');
    try {
      const company = await getCompanyInfo(emailRef.current);
      const meta = computePlanMeta(company);
      setPlanMeta(meta);
      const payload = { planMeta: meta, timestamp: Date.now() };
      memoryCache.set(emailRef.current, payload);
      try { sessionStorage.setItem(key, JSON.stringify(payload)); } catch { /* ignore */ }
      return meta;
    } catch (e) {
      setError(e?.message || 'Failed to load plan meta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (auto && email) { load(false); } }, [email, auto, load]);

  return { planMeta, loading, error, refreshPlanMeta: (force = true) => load(force) };
}

export { computePlanMeta };