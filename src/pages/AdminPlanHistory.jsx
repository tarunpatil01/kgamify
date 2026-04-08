import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchAdminPlanPurchases } from '../api';

export default function AdminPlanHistory({ isDarkMode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchAdminPlanPurchases()
      .then((data) => {
        if (!active) return;
        setRows(Array.isArray(data?.purchases) ? data.purchases : []);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message || 'Failed to load plan purchases');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className={`min-h-[80vh] p-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold text-[#ff8200] mb-4">Plan Purchase History</h1>

      {loading && <div className="text-sm opacity-70">Loading purchases...</div>}
      {!loading && error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && rows.length === 0 && <div className="text-sm opacity-70">No plan purchases found.</div>}

      {!loading && !error && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-900">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Company</th>
                <th className="text-left px-3 py-2">Plan</th>
                <th className="text-left px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={`${row.companyId}-${row.invoiceId || idx}`} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-3 py-2">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{row.companyName || 'N/A'}</div>
                    <div className="text-xs opacity-70">{row.companyEmail || ''}</div>
                  </td>
                  <td className="px-3 py-2">{row.plan}</td>
                  <td className="px-3 py-2">{typeof row.amount === 'number' ? `${row.currency || 'INR'} ${row.amount}` : '-'}</td>
                  <td className="px-3 py-2">{row.status || '-'}</td>
                  <td className="px-3 py-2">{row.invoiceId || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

AdminPlanHistory.propTypes = {
  isDarkMode: PropTypes.bool
};
