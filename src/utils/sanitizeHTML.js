// Safe HTML sanitizer using DOMPurify. Falls back to basic stripping if DOM not available.
import DOMPurify from 'dompurify';

export default function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  try {
    // Configure to allow only a safe subset (links, lists, basic formatting)
    const clean = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'p','strong','em','u','s','blockquote','a','ul','ol','li','br','span','h1','h2','h3','h4','h5','h6'
      ],
      ALLOWED_ATTR: ['href','title','target','rel','class'],
      FORBID_ATTR: ['style','onerror','onclick'],
      ADD_ATTR: ['rel'],
      ADD_TAGS: [],
      RETURN_TRUSTED_TYPE: false
    });
    // Ensure external links are safe
    return clean.replaceAll('<a ', '<a rel="noopener noreferrer" ');
  } catch {
    // Minimal fallback: strip tags
    return String(html).replace(/<[^>]*>/g, '');
  }
}
