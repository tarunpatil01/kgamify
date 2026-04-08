import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchAdminTickets, updateAdminTicket } from '../api';

export default function AdminSupportTickets({ isDarkMode }) {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminTickets({ status, q: query });
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (e) {
      setError(e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const onStatusChange = async (ticketId, nextStatus) => {
    try {
      await updateAdminTicket(ticketId, { status: nextStatus });
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? { ...t, status: nextStatus } : t)));
    } catch {
      // no-op
    }
  };

  return (
    <div className={`min-h-[80vh] p-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold text-[#ff8200] mb-4">Support Tickets</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="open">open</option>
          <option value="in-progress">in-progress</option>
          <option value="resolved">resolved</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by company, email, ticket..."
          className="border rounded px-3 py-2 text-sm min-w-[260px]"
        />
        <button onClick={loadTickets} className="px-4 py-2 rounded bg-[#ff8200] text-white text-sm">
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm opacity-70">Loading tickets...</div>}
      {!loading && error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && tickets.length === 0 && <div className="text-sm opacity-70">No tickets found.</div>}

      {!loading && !error && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <div className="font-semibold text-[#ff8200]">{ticket.ticketNumber}</div>
                  <div className="text-xs opacity-70">{ticket.companyName || 'N/A'} · {ticket.companyEmail}</div>
                </div>
                <select
                  value={ticket.status}
                  onChange={(e) => onStatusChange(ticket._id, e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="open">open</option>
                  <option value="in-progress">in-progress</option>
                  <option value="resolved">resolved</option>
                </select>
              </div>

              <p className="text-sm mt-2">{ticket.issueSummary}</p>
              <p className="text-xs opacity-70 mt-2">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
              {Array.isArray(ticket.transcript) && ticket.transcript.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">View transcript</summary>
                  <div className={`mt-2 rounded border p-2 max-h-48 overflow-y-auto ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                    {ticket.transcript.map((m, idx) => (
                      <p key={idx} className="text-xs mb-1">
                        <strong>[{m.role}]</strong> {m.text}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

AdminSupportTickets.propTypes = {
  isDarkMode: PropTypes.bool
};
