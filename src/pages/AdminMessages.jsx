import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import PropTypes from 'prop-types';
import { getAdminCompanyMessages, sendAdminCompanyMessage } from '../api';
import { useParams, useNavigate } from 'react-router-dom';

export default function AdminMessages({ isDarkMode }) {
  const { companyId } = useParams();
  const [data, setData] = useState(null); // { company, messages }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!companyId) { setError('Missing company id'); setLoading(false); return; }
    let socket;
    let active = true;
    async function init() {
      try {
        const resp = await getAdminCompanyMessages(companyId);
        if (active) {
          setData(resp);
          setError('');
          setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth'}), 50);
        }
      } catch (e) {
        if (active) setError(e?.response?.data?.message || 'Failed to load');
      } finally { if (active) setLoading(false); }
      socket = io('/', { path: '/socket.io', withCredentials: true });
      socket.emit('join', `company:${companyId}`);
      socket.on('message:new', payload => {
        if (payload?.companyId === String(companyId)) {
          setData(d => d ? { ...d, messages: [...d.messages, payload.message] } : d);
          setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth'}), 30);
        }
      });
    }
    init();
    return () => {
      active = false;
      try { socket?.emit('leave', `company:${companyId}`); socket?.disconnect(); } catch {/* ignore */}
    };
  }, [companyId]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    try {
      setSending(true);
      // optimistic
      setData(d=> d ? { ...d, messages:[...d.messages, { message:text, from:'admin', createdAt:new Date().toISOString(), type:'info'}]} : d);
      setInput('');
      await sendAdminCompanyMessage(companyId, text);
  // rely on socket broadcast for delivery
    } catch (e) {
      setError(e?.response?.data?.message || 'Send failed');
    } finally { setSending(false); }
  };

  if (loading) return <div className={`p-6 ${isDarkMode? 'text-white':'text-gray-800'}`}>Loading...</div>;
  if (error) return <div className={`p-6 ${isDarkMode? 'text-red-300':'text-red-600'}`}>{error}</div>;
  if (!data) return null;

  const { company, messages } = data;

  return (
    <div className={`p-4 sm:p-6 min-h-[60vh] ${isDarkMode? 'text-white':'text-gray-900'}`}>
      <div className="max-w-5xl mx-auto flex flex-col h-[70vh]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Messages • {company.companyName}</h2>
            <p className="text-xs opacity-70 break-all">{company.email}</p>
          </div>
          <button onClick={()=>navigate('/admin')} className="px-3 py-1.5 rounded bg-[#ff8200] text-white text-sm">Back</button>
        </div>
        <div className={`flex-1 overflow-y-auto rounded border ${isDarkMode? 'bg-gray-800 border-gray-700':'bg-white border-gray-200'} p-4 space-y-3`}>
          {messages.length===0 && <div className={`text-sm ${isDarkMode? 'text-gray-400':'text-gray-500'}`}>No messages yet.</div>}
          {messages.map((m,i)=>{
            const when = (()=>{ try { return new Date(m.createdAt||Date.now()).toLocaleString(); } catch { return ''; } })();
            const mine = m.from === 'admin';
            return (
              <div key={i} className={`flex ${mine? 'justify-end':'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm shadow border ${mine? (isDarkMode? 'bg-[#ff8200] text-white border-[#ff9200]':'bg-[#ff8200] text-white border-[#ff8200]') : (isDarkMode? 'bg-gray-700 border-gray-600':'bg-gray-100 border-gray-200')}`}>
                  <div className={`text-[10px] mb-1 opacity-70 ${mine? 'text-white':(isDarkMode? 'text-gray-300':'text-gray-500')}`}>{mine? 'Admin':'Company'} • {when}</div>
                  <div className="whitespace-pre-wrap break-words leading-snug">{m.message}</div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} className="mt-4 flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Write a reply..." className={`flex-1 rounded border px-3 py-2 ${isDarkMode? 'bg-gray-800 border-gray-600 placeholder-gray-500':'bg-white border-gray-300 placeholder-gray-400'}`} />
          <button disabled={sending || !input.trim()} className={`px-5 py-2 rounded font-medium text-white ${sending||!input.trim()? 'bg-gray-400 cursor-not-allowed':'bg-[#ff8200] hover:bg-[#e57400]'}`}>{sending? 'Sending...':'Send'}</button>
        </form>
        <p className="mt-1 text-xs opacity-60">Only admins and this company can see these messages.</p>
      </div>
    </div>
  );
}

AdminMessages.propTypes = { isDarkMode: PropTypes.bool };
