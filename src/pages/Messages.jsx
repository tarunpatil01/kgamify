import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import PropTypes from 'prop-types';
import { getCompanyInfo, getCompanyMessages, sendCompanyMessage } from '../api';

export default function Messages({ isDarkMode }) {
  const [email] = useState(() => localStorage.getItem('rememberedEmail') || '');
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

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

  const status = company?.status || 'pending';
  const isApproved = status === 'approved' || company?.approved;

  useEffect(() => {
    let socket;
    let active = true;
    async function init() {
      if (!company?._id && company?.email) {
        // refresh company info to get _id if missing
        try { const refreshed = await getCompanyInfo(company.email); setCompany(refreshed); } catch {/* ignore */}
      }
      if (!company?._id) return;
      try {
        const data = await getCompanyMessages(company.email, 1, 200);
        if (active) {
          setMessages(Array.isArray(data.messages) ? data.messages : []);
          setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth'}), 10);
        }
      } catch {/* ignore */}
      socket = io('/', { path: '/socket.io', withCredentials: true });
      socket.emit('join', `company:${company._id}`);
      socket.on('message:new', payload => {
        if (payload?.companyId === String(company._id)) {
          setMessages(m => [...m, payload.message]);
          setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth'}), 10);
        }
      });
    }
    init();
    return () => {
      active = false;
      try { socket?.emit('leave', `company:${company?._id}`); socket?.disconnect(); } catch {/* ignore */}
    };
  }, [company?._id, company?.email]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !company?.email) return;
    setSending(true);
    try {
      // optimistic append
      const optimistic = { message: text, type: 'info', from: 'company', createdAt: new Date().toISOString() };
      setMessages(m=>[...m, optimistic]);
      setInput('');
      await sendCompanyMessage(company.email, text);
  // server will broadcast; fallback single fetch not strictly needed
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

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

  return (
  <div className={`flex flex-col flex-1 p-4 sm:p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`} style={{minHeight:'calc(100vh - 80px)'}}>
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1">
        <div className={`p-4 rounded border mb-4 ${
          status === 'hold'
            ? (isDarkMode? 'bg-yellow-900/20 border-yellow-700 text-yellow-200':'bg-yellow-50 border-yellow-200 text-yellow-900')
            : status === 'denied'
              ? (isDarkMode? 'bg-red-900/20 border-red-700 text-red-200':'bg-red-50 border-red-200 text-red-900')
              : isApproved
                ? (isDarkMode? 'bg-green-900/20 border-green-700 text-green-200':'bg-green-50 border-green-200 text-green-900')
                : (isDarkMode? 'bg-blue-900/20 border-blue-700 text-blue-200':'bg-blue-50 border-blue-200 text-blue-900')
        }`}>
          <div className="font-semibold mb-1">Account Status: {(isApproved ? 'Approved' : status.charAt(0).toUpperCase() + status.slice(1))}</div>
          {status === 'hold' && <div className="text-sm opacity-90">Your account is on hold. You can edit details but cannot post jobs.</div>}
          {status === 'pending' && <div className="text-sm opacity-90">Your account is pending admin review.</div>}
          {status === 'denied' && <div className="text-sm opacity-90">Your account was denied. You may re-register after addressing issues.</div>}
          {isApproved && <div className="text-sm opacity-90">Your account is active. You can post jobs and view analytics.</div>}
        </div>
        <div className={`flex-1 overflow-y-auto rounded border ${isDarkMode? 'bg-gray-800 border-gray-700':'bg-white border-gray-200'} p-4 space-y-3`}> 
          {messages.length === 0 && (
            <div className={`text-sm ${isDarkMode? 'text-gray-400':'text-gray-500'}`}>No messages yet. Start the conversation below.</div>
          )}
          {messages.map((m,i)=>{
            const when = (()=>{ try { return new Date(m.createdAt||Date.now()).toLocaleString(); } catch { return ''; } })();
            const mine = m.from === 'company';
            return (
              <div key={i} className={`flex ${mine? 'justify-end':'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow border ${mine? (isDarkMode? 'bg-[#ff8200] text-white border-[#ff9200]':'bg-[#ff8200] text-white border-[#ff8200]') : (isDarkMode? 'bg-gray-700 border-gray-600':'bg-gray-100 border-gray-200')}`}>
                  <div className={`text-[10px] mb-1 opacity-70 ${mine? 'text-white':(isDarkMode? 'text-gray-400':'text-gray-500')}`}>{mine? 'You':'Admin'} • {when}</div>
                  <div className="whitespace-pre-wrap break-words leading-snug">{m.message}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e)=>setInput(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 rounded border px-3 py-2 ${isDarkMode? 'bg-gray-800 border-gray-600 placeholder-gray-500':'bg-white border-gray-300 placeholder-gray-400'}`}
            maxLength={2000}
          />
          <button disabled={sending || !input.trim()} className={`px-5 py-2 rounded font-medium text-white ${sending||!input.trim()? 'bg-gray-400 cursor-not-allowed':'bg-[#ff8200] hover:bg-[#e57400]'}`}>{sending? 'Sending...':'Send'}</button>
        </form>
  <p className="mt-1 mb-2 text-xs opacity-60">Messages are visible to KGamify admins. Avoid sharing sensitive credentials.</p>
      </div>
    </div>
  );
}

Messages.propTypes = { isDarkMode: PropTypes.bool };
