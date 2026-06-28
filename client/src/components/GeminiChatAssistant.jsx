import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import Cookies from 'js-cookie';

const GeminiChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const username = Cookies.get("username") || "Farmer";
  
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Welcome to AgriVista, ${username}! I'm your expert farm advisor. How can I help you today?` }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `System: You are the AgriVista Advisor. Provide expert agricultural advice. \n\n User: ${input}` }]
          }
        ]
      });

      const text = response.text;
      setMessages(prev => [...prev, { role: "assistant", content: text }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 9999 }}>
      {isOpen && (
        <div className="dash-card mb-4 animate-slideUp" style={{ width: '360px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: 'linear-gradient(135deg, var(--leaf), var(--forest))', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={20} />
              <span style={{ fontFamily: 'var(--ff-head)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.2px' }}>AgriVista Advisor</span>
            </div>
            <button className="btn p-0 text-white border-0 shadow-none" onClick={() => setIsOpen(false)} style={{ opacity: 0.8, transition: 'opacity 0.2s' }} onMouseOver={e=>e.currentTarget.style.opacity=1} onMouseOut={e=>e.currentTarget.style.opacity=0.8}>
              <X size={18} />
            </button>
          </div>

          <div className="card-body overflow-auto p-3" style={{ height: '380px', backgroundColor: 'var(--mint-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontFamily: 'var(--ff-body)',
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    backgroundColor: msg.role === 'user' ? 'var(--forest)' : '#fff',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-dark)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(74,222,128,0.2)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                    borderBottomLeftRadius: msg.role === 'user' ? '12px' : '4px'
                  }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--ff-body)' }}>
                <div className="spinner-grow spinner-grow-sm" role="status" style={{ color: 'var(--leaf)' }}></div>
                <span>Analysing data...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '15px', backgroundColor: '#fff', borderTop: '1px solid rgba(74,222,128,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--mint-faint)', borderRadius: '24px', padding: '4px 12px', border: '1px solid rgba(74,222,128,0.3)', transition: 'border-color 0.2s' }}>
              <input
                className="form-control border-0 bg-transparent shadow-none"
                placeholder="Ask your farm advisor..."
                style={{ fontSize: '0.85rem', fontFamily: 'var(--ff-body)', boxShadow: 'none' }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="btn p-1 border-0 shadow-none" onClick={handleSendMessage} disabled={loading} style={{ color: 'var(--forest)', opacity: input.trim() ? 1 : 0.5 }}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className="btn d-flex align-items-center justify-content-center transition-all"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: 'var(--leaf)',
          color: '#fff',
          border: 'none',
          boxShadow: '0 8px 20px rgba(74,222,128, 0.4)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .transition-all { transition: all 0.3s ease; }
        .transition-all:hover { transform: scale(1.05); filter: brightness(1.05); }
      `}</style>
    </div>
  );
};

export default GeminiChatAssistant;