import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getCompanyInfo } from '../api';

function TypeBadge({ type }) {
  const styles = {
    hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    deny: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    system: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  const label = (type || 'info').toUpperCase();
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${styles[type] || styles.info}`}>{label}</span>;
}

TypeBadge.propTypes = { type: PropTypes.string };

export default function Messages({ isDarkMode }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) setEmail(remembered);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!email) { setLoading(false); return; }
      try {
        const data = await getCompanyInfo(email);
        setCompany(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [email]);

  const messages = (company?.adminMessages || []).filter(m => filter === 'all' ? true : (m.type === filter));

  return (
    <div className={`min-h-screen p-4 sm:p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`max-w-4xl mx-auto rounded-xl shadow ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className="text-2xl font-bold">Account Messages</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View important updates from the admin team. Status: <strong className="text-[#ff8200]">{company?.status || '—'}</strong>
          </p>
        </div>
        <div className="px-6 py-4 flex items-center gap-3 flex-wrap">
          <label className="text-sm opacity-80">Filter:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`px-3 py-2 rounded border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
            <option value="all">All</option>
            <option value="hold">Hold</option>
            <option value="deny">Deny</option>
            <option value="info">Info</option>
            <option value="system">System</option>
          </select>
          <div className="ml-auto text-sm opacity-70">{messages.length} message(s)</div>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center opacity-80">Loading messages…</div>
        ) : messages.length === 0 ? (
          <div className={`px-6 py-12 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No messages yet.</div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {messages.map((m, idx) => (
              <div key={idx} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <TypeBadge type={m.type} />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</span>
                </div>
                <div className="mt-2 whitespace-pre-wrap leading-relaxed">{m.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Messages.propTypes = { isDarkMode: PropTypes.bool };
