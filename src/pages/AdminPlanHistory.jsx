import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchAdminPlanPurchases } from '../api';

export default function AdminPlanHistory({ isDarkMode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCompanies, setOpenCompanies] = useState({});

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
        <div className="space-y-3">
          {Object.values(rows.reduce((acc, row) => {
            const key = `${row.companyId || row.companyEmail || 'unknown'}`;
            if (!acc[key]) {
              acc[key] = {
                companyId: row.companyId,
                companyName: row.companyName || 'N/A',
                companyEmail: row.companyEmail || '',
                purchases: []
              };
            }
            acc[key].purchases.push(row);
            return acc;
          }, {})).map((group) => (
            <div key={String(group.companyId || group.companyEmail)} className={`rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => setOpenCompanies((prev) => ({
                  ...prev,
                  [String(group.companyId || group.companyEmail)]: !prev[String(group.companyId || group.companyEmail)]
                }))}
                className="w-full text-left px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-[#ff8200]">{group.companyName}</div>
                  <div className="text-xs opacity-70">{group.companyEmail}</div>
                </div>
                <div className="text-xs opacity-70">{group.purchases.length} plan entries</div>
              </button>

              {openCompanies[String(group.companyId || group.companyEmail)] && (
                <div className="px-4 pb-4">
                  <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-900">
                        <tr>
                          <th className="text-left px-3 py-2">Date</th>
                          <th className="text-left px-3 py-2">Plan</th>
                          <th className="text-left px-3 py-2">Amount</th>
                          <th className="text-left px-3 py-2">Status</th>
                          <th className="text-left px-3 py-2">Invoice</th>
                          <th className="text-left px-3 py-2">Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.purchases.map((row, idx) => (
                          <tr key={`${row.invoiceId || 'inv'}-${idx}`} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-3 py-2">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '-'}</td>
                            <td className="px-3 py-2">{row.plan || '-'}</td>
                            <td className="px-3 py-2">{typeof row.amount === 'number' ? `${row.currency || 'INR'} ${row.amount}` : '-'}</td>
                            <td className="px-3 py-2">{row.status || '-'}</td>
                            <td className="px-3 py-2">{row.invoiceId || '-'}</td>
                            <td className="px-3 py-2 text-xs">{row.paymentProvider || '-'} {row.paymentId ? `(${row.paymentId})` : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

AdminPlanHistory.propTypes = {
  isDarkMode: PropTypes.bool
};
