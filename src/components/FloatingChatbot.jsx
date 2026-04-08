import { useEffect, useRef, useState } from "react";
import { sendMessage } from "../services/chatbotApi";
import { FaRobot, FaUser, FaTimes } from "react-icons/fa";
import { fetchChatHistory, raiseSupportTicket, saveChatMessage } from "../api";

const UNRESOLVED_PATTERNS = [
  'i could not',
  'unable to',
  'not sure',
  'cannot help',
  'try again later',
  'service unavailable',
  'error connecting'
];

function getCompanyContext() {
  let company = null;
  try {
    company = JSON.parse(localStorage.getItem('companyData') || 'null');
  } catch {
    company = null;
  }
  const email =
    company?.email ||
    localStorage.getItem('rememberedEmail') ||
    sessionStorage.getItem('sessionEmail') ||
    '';
  const companyName = company?.companyName || '';
  return { email, companyName };
}

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [offerEscalation, setOfferEscalation] = useState(false);
  const [raisingTicket, setRaisingTicket] = useState(false);
  const messagesEndRef = useRef(null);
  const { email, companyName } = getCompanyContext();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    let active = true;
    if (!email) return () => {};

    fetchChatHistory(email)
      .then((data) => {
        if (!active) return;
        const history = Array.isArray(data?.messages) ? data.messages : [];
        if (history.length) {
          setMessages(history.map((m) => ({ role: m.role, text: m.text })));
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [email]);

  const persistMessage = async (role, messageText) => {
    if (!email || !messageText) return;
    try {
      await saveChatMessage({
        email,
        companyName,
        role,
        text: messageText
      });
    } catch {
      // best effort persistence
    }
  };

  const maybeOfferEscalation = (aiReply) => {
    const userTurns = messages.filter((m) => m.role === 'user').length + 1;
    if (userTurns < 3) {
      setOfferEscalation(false);
      return;
    }

    const lower = String(aiReply || '').toLowerCase();
    const unresolved = UNRESOLVED_PATTERNS.some((pattern) => lower.includes(pattern));
    setOfferEscalation(unresolved);
  };

  const send = async () => {
    if (!text.trim()) return;

    const userMsg = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setLoading(true);
    setOfferEscalation(false);

    persistMessage('user', userMsg.text);

    try {
      const res = await sendMessage(userMsg.text);
      const replyText = res?.data?.reply || 'I could not generate a response right now.';
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: replyText },
      ]);
      persistMessage('ai', replyText);
      maybeOfferEscalation(replyText);
    } catch {
      const errorReply = 'Error connecting to AI. If this continues, you can raise a support ticket.';
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: errorReply },
      ]);
      persistMessage('ai', errorReply);
      maybeOfferEscalation(errorReply);
    } finally {
      setLoading(false);
    }
  };

  const raiseTicketFromChat = async () => {
    if (!email) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          text: 'Please login as a company to raise a support ticket from chatbot.'
        }
      ]);
      return;
    }

    const lastUserQuestion = [...messages].reverse().find((m) => m.role === 'user')?.text || 'Chatbot support needed';
    setRaisingTicket(true);
    try {
      const ticketRes = await raiseSupportTicket({
        email,
        companyName,
        issueSummary: lastUserQuestion,
        transcript: messages.slice(-50)
      });
      const systemText = `Support ticket ${ticketRes?.ticket?.ticketNumber || ''} has been raised. We have notified admin@kgamify.com and you will get a reply within 24 hours.`.trim();
      setMessages((prev) => [...prev, { role: 'system', text: systemText }]);
      persistMessage('system', systemText);
      setOfferEscalation(false);
    } catch {
      const failText = 'Ticket creation failed right now. Please try again in a moment.';
      setMessages((prev) => [...prev, { role: 'system', text: failText }]);
      persistMessage('system', failText);
    } finally {
      setRaisingTicket(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50
                   bg-orange-500 hover:bg-orange-600
                   text-white p-4 rounded-full shadow-xl
                   transition-transform hover:scale-110"
      >
        <FaRobot size={22} />
      </button>

      {/* Chat Window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50
                     w-[380px] h-[520px]
                     bg-white rounded-2xl shadow-2xl
                     flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between
                          bg-orange-500 text-white px-4 py-3">
            <span className="font-semibold">KGamify Assistant</span>
            <button onClick={() => setOpen(false)}>
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 px-4 py-3 space-y-3
                          overflow-y-auto scrollbar-thin">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2 ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "ai" && (
                  <FaRobot className="text-orange-500 mt-1 shrink-0" />
                )}

                <div
                  className={`px-3 py-2 rounded-xl text-sm max-w-[70%]
                  ${
                    m.role === "user"
                      ? "bg-orange-500 text-white"
                      : m.role === 'system'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.text}
                </div>

                {m.role === "user" && (
                  <FaUser className="text-gray-500 mt-1 shrink-0" />
                )}
              </div>
            ))}

            {loading && (
              <div className="text-xs text-orange-500 animate-pulse">
                Generating response...
              </div>
            )}

            {offerEscalation && !loading && (
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
                <p className="font-medium mb-2">Need further help with this issue?</p>
                <div className="flex gap-2">
                  <button
                    onClick={raiseTicketFromChat}
                    disabled={raisingTicket}
                    className="px-3 py-1.5 rounded bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold disabled:opacity-60"
                  >
                    {raisingTicket ? 'Raising Ticket...' : 'Yes, Raise Ticket'}
                  </button>
                  <button
                    onClick={() => setOfferEscalation(false)}
                    className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100"
                  >
                    No, Continue Chat
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about jobs, resumes..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={send}
              className="bg-orange-500 hover:bg-orange-600
                         text-white px-4 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}