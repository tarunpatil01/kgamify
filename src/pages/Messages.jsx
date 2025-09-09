import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getCompanyInfo } from '../api';

export default function Messages({ isDarkMode }) {
  const [email] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!email) { setError('Not logged in'); setLoading(false); return; }
        const data = await getCompanyInfo(email);
        setCompany(data);
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    })();
  }, [email]);

  if (loading) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Loading…</div>
    );
  }
  if (error) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>{error}</div>
    );
  }

  const status = company?.status || 'pending';
  const msgs = Array.isArray(company?.adminMessages) ? company.adminMessages : [];

  return (
    <div className={`min-h-[60vh] p-4 sm:p-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className={`p-4 rounded border ${status === 'hold' ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-700' : status === 'denied' ? 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:text-red-200 dark:border-red-700' : 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-700'}`}>
          <div className="font-semibold mb-1">Account Status: {status.charAt(0).toUpperCase() + status.slice(1)}</div>
          {status === 'hold' && (
            <div className="text-sm opacity-90">Your account is on hold. You can edit registration details but cannot post jobs or access analytics.</div>
          )}
          {status === 'pending' && (
            <div className="text-sm opacity-90">Your account is pending admin review.</div>
          )}
          {status === 'denied' && (
            <div className="text-sm opacity-90">Your account was denied. You may re-register after addressing issues.</div>
          )}
        </div>

        <div className="p-4 rounded border bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="font-semibold mb-2">Messages from Admin</div>
          {msgs.length === 0 ? (
            <div className="text-sm opacity-70">No messages yet.</div>
          ) : (
            <ul className="space-y-3">
              {msgs.map((m, i) => (
                <li key={i} className="p-3 rounded border dark:border-gray-700">
                  <div className="text-xs opacity-60 mb-1">{new Date(m.createdAt || Date.now()).toLocaleString()} • {m.type}</div>
                  <div className="text-sm">{m.message}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

Messages.propTypes = { isDarkMode: PropTypes.bool };
