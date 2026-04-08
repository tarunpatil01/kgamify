import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchCompanyTickets } from '../api';

export default function SupportTickets({ isDarkMode }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  let companyFromStorage = null;
  try {
    companyFromStorage = JSON.parse(localStorage.getItem('companyData') || 'null');
  } catch {
    companyFromStorage = null;
  }
  const companyEmail =
    localStorage.getItem('rememberedEmail') ||
    companyFromStorage?.email ||
    sessionStorage.getItem('sessionEmail') ||
    '';

  useEffect(() => {
    let active = true;
    if (!companyEmail) {
      setError('Please login to view support tickets.');
      setLoading(false);
      return () => {};
    }

    fetchCompanyTickets(companyEmail)
      .then((data) => {
        if (!active) return;
        setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message || 'Failed to load tickets');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [companyEmail]);

  return (
    <div className={`min-h-[70vh] p-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold text-[#ff8200] mb-2">Support Tickets</h1>
      <p className="text-sm opacity-80 mb-6">All ticket history raised from chatbot or portal.</p>

      {loading && <div className="text-sm opacity-70">Loading tickets...</div>}
      {!loading && error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && tickets.length === 0 && (
        <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          No tickets yet.
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="font-semibold text-[#ff8200]">{ticket.ticketNumber}</div>
                <div className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {ticket.status}
                </div>
              </div>
              <p className="text-sm mb-2">{ticket.issueSummary}</p>
              <p className="text-xs opacity-70">Created: {new Date(ticket.createdAt).toLocaleString()}</p>
              {ticket.resolutionNote ? (
                <p className="text-xs mt-2 p-2 rounded bg-green-50 text-green-800 border border-green-200">
                  Resolution: {ticket.resolutionNote}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

SupportTickets.propTypes = {
  isDarkMode: PropTypes.bool
};
