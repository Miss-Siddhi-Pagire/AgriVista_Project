import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const GeminiChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to AgriVista! I'm your AI farm advisor. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  // Theme colors derived from the landscape UI
  const colors = {
    primaryGreen: "#6A8E23", // Olive Green
    deepGreen: "#4A6317",
    creamBg: "#F9F8F3",
    textDark: "#2C3322",
    white: "#ffffff"
  };

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
            parts: [{ text: `System: You are the AgriVista AI. Provide expert agricultural advice. \n\n User: ${input}` }] 
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
        <div className="card shadow-lg border-0 mb-4 animate-slideUp" style={{ width: '350px', borderRadius: '20px', overflow: 'hidden', backgroundColor: colors.white }}>
          {/* Header styled with the deep moss green */}
          <div className="card-header border-0 d-flex justify-content-between align-items-center py-3" style={{ backgroundColor: colors.deepGreen, color: colors.white }}>
            <div className="d-flex align-items-center gap-2">
              <Bot size={20} />
              <span className="fw-bold small font-serif">AgriVista Advisor</span>
            </div>
            <button className="btn p-0 text-white border-0 shadow-none" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="card-body overflow-auto px-3" style={{ height: '380px', backgroundColor: colors.creamBg }}>
            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-end' : ''}`}>
                <div className={`d-inline-block p-3 rounded-4 small shadow-sm ${msg.role === 'user' ? 'text-white' : 'bg-white text-dark border-0'}`} 
                     style={{ 
                        maxWidth: '85%', 
                        backgroundColor: msg.role === 'user' ? colors.primaryGreen : colors.white,
                        lineHeight: '1.5'
                     }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="d-flex align-items-center gap-2 text-muted small p-2">
                <div className="spinner-grow spinner-grow-sm" role="status" style={{ color: colors.primaryGreen }}></div>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area matching the clean form styles */}
          <div className="p-3 bg-white">
            <div className="input-group align-items-center bg-light rounded-pill px-3 py-1">
              <input 
                className="form-control border-0 bg-transparent shadow-none small" 
                placeholder="Ask your farm advisor..." 
                style={{ fontSize: '0.9rem' }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="btn p-1 border-0 shadow-none" onClick={handleSendMessage} disabled={loading}>
                <Send size={20} style={{ color: colors.primaryGreen }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button with modern shadow and project color */}
      <button 
        className="btn shadow-lg rounded-circle d-flex align-items-center justify-content-center transition-all" 
        style={{ 
          width: '60px', 
          height: '60px', 
          backgroundColor: colors.primaryGreen, 
          color: colors.white,
          border: 'none',
          boxShadow: '0 8px 24px rgba(106, 142, 35, 0.4)'
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
        .font-serif { font-family: 'Playfair Display', serif; }
        .transition-all { transition: all 0.3s ease; }
        .transition-all:hover { transform: scale(1.05); filter: brightness(1.1); }
      `}</style>
    </div>
  );
};

export default GeminiChatAssistant;