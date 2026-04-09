import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { fetchCompanyTickets, postCompanyTicketMessage } from '../api';
import { config } from '../config/env';

function formatTime(value) {
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

function appendMessageUnique(messages, nextMessage) {
  const current = Array.isArray(messages) ? messages : [];
  const key = `${nextMessage?.role || ''}|${nextMessage?.text || ''}|${nextMessage?.createdAt || ''}`;
  if (current.some((m) => `${m?.role || ''}|${m?.text || ''}|${m?.createdAt || ''}` === key)) {
    return current;
  }
  return [...current, nextMessage];
}

export default function SupportTickets({ isDarkMode }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [reply, setReply] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const joinedRoomsRef = useRef(new Set());

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
        const list = Array.isArray(data?.tickets) ? data.tickets : [];
        setTickets(list);
        if (list.length) {
          setSelectedTicketId((prev) => prev || String(list[0]._id));
        }
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

  useEffect(() => {
    const socket = io(config.API_URL.replace(/\/api\/?$/, ''), { transports: ['websocket'] });
    socketRef.current = socket;
    const joinedRooms = joinedRoomsRef.current;

    socket.on('ticket:message', ({ ticketId, message }) => {
      if (!ticketId || !message) return;
      const incomingId = String(ticketId);

      setTickets((prev) => prev.map((ticket) => {
        if (String(ticket._id) !== incomingId) return ticket;
        const messages = appendMessageUnique(ticket.messages, message);
        return { ...ticket, messages };
      }));

      if (incomingId !== String(selectedTicketId) && message.role === 'admin') {
        setUnreadCounts((prev) => ({ ...prev, [incomingId]: (prev[incomingId] || 0) + 1 }));
      }
    });

    socket.on('ticket:typing', ({ ticketId, by, isTyping }) => {
      if (String(ticketId) !== String(selectedTicketId)) return;
      if (by !== 'admin') return;
      setIsAdminTyping(Boolean(isTyping));
    });

    return () => {
      joinedRooms.forEach((room) => socket.emit('leave', room));
      joinedRooms.clear();
      socket.disconnect();
    };
  }, [selectedTicketId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const nextRooms = new Set((tickets || []).map((t) => `ticket:${t._id}`));

    nextRooms.forEach((room) => {
      if (!joinedRoomsRef.current.has(room)) {
        socket.emit('join', room);
        joinedRoomsRef.current.add(room);
      }
    });
  }, [tickets]);

  useEffect(() => {
    if (!selectedTicketId) return;
    setUnreadCounts((prev) => ({ ...prev, [selectedTicketId]: 0 }));
    setIsAdminTyping(false);
  }, [selectedTicketId]);

  const selectedTicket = useMemo(() => tickets.find((t) => String(t._id) === String(selectedTicketId)) || null, [tickets, selectedTicketId]);

  const sendReply = async () => {
    const text = reply.trim();
    if (!selectedTicket || !text) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketRef.current?.emit('ticket:typing', {
      ticketId: selectedTicket._id,
      by: 'company',
      isTyping: false
    });

    setReply('');
    try {
      const result = await postCompanyTicketMessage(selectedTicket._id, { email: companyEmail, text });
      const msg = result?.message;
      if (!msg) return;
      setTickets((prev) => prev.map((ticket) => {
        if (String(ticket._id) !== String(selectedTicket._id)) return ticket;
        const messages = appendMessageUnique(ticket.messages, msg);
        return { ...ticket, messages };
      }));
    } catch (e) {
      setError(e.message || 'Failed to send message');
    }
  };

  const onReplyChange = (value) => {
    setReply(value);
    if (!selectedTicket) return;

    socketRef.current?.emit('ticket:typing', {
      ticketId: selectedTicket._id,
      by: 'company',
      isTyping: value.trim().length > 0
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('ticket:typing', {
        ticketId: selectedTicket._id,
        by: 'company',
        isTyping: false
      });
    }, 900);
  };

  return (
    <div className={`min-h-[70vh] p-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold text-[#ff8200] mb-2">Support Tickets</h1>
      <p className="text-sm opacity-80 mb-6">Track every conversation with support in one place.</p>

      {loading && <div className="text-sm opacity-70">Loading tickets...</div>}
      {!loading && error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && tickets.length === 0 && (
        <div className={`rounded-lg border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          No tickets yet.
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-3">
            {tickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => setSelectedTicketId(String(ticket._id))}
                className={`w-full text-left rounded-lg border p-3 ${String(selectedTicketId) === String(ticket._id) ? 'border-[#ff8200]' : isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-[#ff8200]">{ticket.ticketNumber}</div>
                  {!!unreadCounts[String(ticket._id)] && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">
                      {unreadCounts[String(ticket._id)]} new
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-70 mt-1 line-clamp-2">{ticket.issueSummary}</div>
                <div className="text-[11px] opacity-60 mt-2">Updated {formatTime(ticket.updatedAt || ticket.createdAt)}</div>
              </button>
            ))}
          </div>

          <div className={`md:col-span-2 rounded-lg border p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            {!selectedTicket ? (
              <div className="text-sm opacity-70">Select a ticket to view conversation.</div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#ff8200]">{selectedTicket.ticketNumber}</h2>
                    <p className="text-xs opacity-70">{selectedTicket.issueSummary}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">{selectedTicket.status}</span>
                </div>

                <div className={`h-72 overflow-y-auto rounded border p-3 mb-3 ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  {(selectedTicket.messages || []).length === 0 && (
                    <div className="text-xs opacity-70">No replies yet. You can continue the conversation here.</div>
                  )}
                  {(selectedTicket.messages || []).map((m, idx) => {
                    const fromAdmin = m.role === 'admin';
                    const fromSystem = m.role === 'system';
                    const bubbleClass = fromSystem
                      ? 'bg-gray-200 text-gray-800 mx-auto'
                      : fromAdmin
                        ? 'bg-blue-100 text-blue-900 mr-auto'
                        : 'bg-orange-100 text-orange-900 ml-auto';

                    return (
                      <div key={idx} className={`mb-2 max-w-[85%] p-2 rounded text-sm ${bubbleClass}`}>
                        <div className="text-[10px] uppercase opacity-70 mb-1">{m.role}</div>
                        <div>{m.text}</div>
                        <div className="text-[10px] opacity-60 mt-1">{formatTime(m.createdAt)}</div>
                      </div>
                    );
                  })}
                  {isAdminTyping && (
                    <div className="text-xs text-blue-600 mt-2">Support is typing...</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => onReplyChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                    placeholder="Reply to support..."
                    className="flex-1 border rounded px-3 py-2 text-sm"
                  />
                  <button onClick={sendReply} className="px-4 py-2 rounded bg-[#ff8200] text-white text-sm">Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

SupportTickets.propTypes = {
  isDarkMode: PropTypes.bool
};
