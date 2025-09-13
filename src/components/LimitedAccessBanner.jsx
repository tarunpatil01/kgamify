import { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * LimitedAccessBanner
 * Props:
 *  - company: company object
 *  - isDarkMode: boolean
 *  - className: optional extra classes
 *  Behavior:
 *   * Animates progress bar from 0 to computed profileCompletion value
 *   * Provides accessible labels & reduced-motion fallback
 */
export default function LimitedAccessBanner({ company, isDarkMode, className = '' }) {
  const limitedAccess = typeof window !== 'undefined' && localStorage.getItem('companyLimitedAccess') === 'true';
  const status = company?.status;
  const isPending = status === 'pending';

  // Compute completion (fallback heuristic when missing)
  const targetCompletion = useMemo(() => {
    if (typeof company?.profileCompletion === 'number' && company.profileCompletion >= 0) {
      return Math.min(100, Math.round(company.profileCompletion));
    }
    if (!company) return 0;
    const PROFILE_FIELDS = ['companyName','industry','location','contactName','phone','address','size','registrationNumber','description','website','documents','logo'];
    const filled = PROFILE_FIELDS.reduce((acc, f) => acc + (company?.[f] ? 1 : 0), 0);
    return Math.round((filled / PROFILE_FIELDS.length) * 100);
  }, [company]);

  const [animatedValue, setAnimatedValue] = useState(0);
  useEffect(() => {
    if (!limitedAccess) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setAnimatedValue(targetCompletion); return; }
  let frame; // animation frame id
    const start = performance.now();
    const duration = 900; // ms
    const from = 0;
    const to = targetCompletion;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setAnimatedValue(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [targetCompletion, limitedAccess]);

  if (!limitedAccess) return null;

  return (
    <div
      className={`p-4 rounded-lg border text-sm flex flex-col gap-2 transition-colors ${
        isDarkMode
          ? 'bg-gradient-to-r from-gray-800/70 via-gray-800/60 to-gray-800/50 border-gray-700 text-gray-200'
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="font-semibold flex flex-wrap items-center gap-2 tracking-tight">
        {isPending ? 'Awaiting approval' : 'Access limited'}
        {status && (
          <span
            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md tracking-wide ${
              isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-yellow-200 text-yellow-900'
            }`}
          >
            {status}
          </span>
        )}
      </div>
      <div className="leading-snug">
        {isPending ? (
          <>Your company is awaiting admin approval. You can explore the dashboard but <strong>posting jobs is disabled</strong> until approval.</>
        ) : (
          <>Your account access is temporarily limited. Review <a href="/messages" className={`underline font-medium ${isDarkMode ? 'text-[#ffb347]' : 'text-[#ff8200]'}`}>Messages</a> for details.</>
        )}
      </div>
      {!company?.profileCompleted && (
        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <div
              className={`h-2 rounded-full overflow-hidden relative ${
                isDarkMode ? 'bg-gray-700/80' : 'bg-yellow-100'
              }`}
              aria-label="Profile completion progress bar"
            >
              <div
                className={`h-full transition-[width] duration-300 ease-out will-change-[width] ${
                  animatedValue === 100
                    ? 'bg-green-500'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-[#ff8200] via-[#ff9d33] to-[#ffb347]'
                      : 'bg-gradient-to-r from-[#ff8200] to-[#ffb347]'
                }`}
                style={{ width: `${animatedValue}%` }}
              />
            </div>
            <div className="mt-1 text-[11px] font-medium flex items-center gap-2 select-none">
              <span>{animatedValue}% complete</span>
              {animatedValue < 100 && (
                <span className={isDarkMode ? 'text-gray-400' : 'text-yellow-700'}>Finish profile to speed approval.</span>
              )}
            </div>
          </div>
          <a
            href="/Edit-Registration"
            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold transition shadow ${
              isDarkMode ? 'bg-[#ff8200] hover:bg-[#e57400] text-white' : 'bg-[#ff8200] hover:bg-[#e57400] text-white'
            }`}
          >
            Complete Profile
          </a>
        </div>
      )}
    </div>
  );
}

LimitedAccessBanner.propTypes = {
  company: PropTypes.object,
  isDarkMode: PropTypes.bool,
  className: PropTypes.string
};