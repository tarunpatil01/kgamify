import { useEffect, useRef, useState } from "react";
import { sendMessage } from "../services/chatbotApi";
import { FaRobot, FaUser, FaTimes } from "react-icons/fa";

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    if (!text.trim()) return;

    const userMsg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setText("");
    setLoading(true);

    try {
      const res = await sendMessage(userMsg.text);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "❌ Error connecting to AI." },
      ]);
    } finally {
      setLoading(false);
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