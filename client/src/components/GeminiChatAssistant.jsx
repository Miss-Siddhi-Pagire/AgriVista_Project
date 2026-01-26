import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const GeminiChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to AgriVista! I'm your AI farm advisor. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Matches your Python logic: client = genai.Client(api_key=api_key)
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
      // Matches your Python call: response = client.models.generate_content(...)
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: [
          { 
            role: "user", 
            parts: [{ text: `System: You are the AgriVista AI. Provide expert agricultural advice. \n\n User: ${input}` }] 
          }
        ]
      });

      // In the new SDK, text is a property, not a function
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
    // High z-index (9999) ensures it isn't hidden behind the Footer/Navbar
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
      {isOpen && (
        <div className="card shadow-lg border-0 mb-3" style={{ width: '320px', borderRadius: '15px', overflow: 'hidden' }}>
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-3">
            <span className="fw-bold small">AgriVista Advisor</span>
            <button className="btn-close btn-close-white" onClick={() => setIsOpen(false)}></button>
          </div>
          <div className="card-body overflow-auto" style={{ height: '350px', backgroundColor: '#f9fafb' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 ${msg.role === 'user' ? 'text-end' : ''}`}>
                <div className={`d-inline-block p-2 rounded-3 small shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white text-dark border'}`} style={{ maxWidth: '85%' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-muted small">AI is thinking...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 border-top bg-white">
            <div className="input-group input-group-sm">
              <input 
                className="form-control border-0 bg-light shadow-none" 
                placeholder="Ask a question..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="btn btn-primary px-3" onClick={handleSendMessage} disabled={loading} style={{ backgroundColor: '#1a5928', border: 'none' }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      <button 
        className="btn btn-dark shadow-lg rounded-circle d-flex align-items-center justify-content-center" 
        style={{ width: '55px', height: '55px', backgroundColor: '#1a5928', border: 'none' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "🤖"}
      </button>
    </div>
  );
};

export default GeminiChatAssistant;