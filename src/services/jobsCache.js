// Simple in-memory jobs cache with TTL and promise de-duplication
// NOTE: Resets on page reload; intended for short-lived performance optimization.
import { getJobs } from '../api';

const CACHE_TTL_MS = 60_000; // 1 minute
const cache = new Map(); // key -> { data, expires }
const inflight = new Map(); // key -> promise

function makeKey(params){
  return JSON.stringify(params || {});
}

export async function getJobsCached(params){
  const key = makeKey(params);
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && existing.expires > now){
    return existing.data;
  }
  if (inflight.has(key)){
    return inflight.get(key);
  }
  const p = (async ()=>{
    try {
      const data = await getJobs(params);
      cache.set(key,{ data, expires: now + CACHE_TTL_MS });
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key,p);
  return p;
}

export function clearJobsCache(){
  cache.clear();
  inflight.clear();
}

export function primeJobsCache(params,data){
  cache.set(makeKey(params),{ data, expires: Date.now() + CACHE_TTL_MS });
}
