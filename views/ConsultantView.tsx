
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { createAdvisorSession, askAdvisor } from '../services/geminiService';
import { Chat } from "@google/genai";
import { Header } from '../components/Header';
import { IconSend, IconTrash } from '../components/Icons';
import { loadUser } from '../utils/helpers';

const ADVISORS = {
  ORACLE: { desc: "Interpretation of truth and void.", color: "text-indigo-400", bg: "bg-indigo-950/20", border: "border-indigo-900" },
  STRATEGIST: { desc: "Optimization and cold logic.", color: "text-cyan-400", bg: "bg-cyan-950/20", border: "border-cyan-900" },
  TITAN: { desc: "Discipline and physical mastery.", color: "text-rose-500", bg: "bg-rose-950/20", border: "border-rose-900" },
  MYSTIC: { desc: "Emotional intelligence and soul.", color: "text-emerald-400", bg: "bg-emerald-950/20", border: "border-emerald-900" }
};

export const ConsultantView: React.FC = () => {
  const [advisor, setAdvisor] = useState<keyof typeof ADVISORS>('ORACLE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUser = loadUser();

  const getStorageKey = (type: string) => `chat_history_${currentUser?.id}_${type}`;

  const switchAdvisor = (type: keyof typeof ADVISORS) => {
    setAdvisor(type);
    const saved = localStorage.getItem(getStorageKey(type));
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{ id: 'init', role: 'model', text: `Speak, Seeker. I listen.`, timestamp: Date.now() }]);
    }
    chatRef.current = createAdvisorSession(type);
  };

  useEffect(() => { switchAdvisor('ORACLE'); }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (currentUser && messages.length > 0) localStorage.setItem(getStorageKey(advisor), JSON.stringify(messages));
  }, [messages, advisor]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    setLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText, timestamp: Date.now() }]);
    
    if (chatRef.current) {
      const res = await askAdvisor(chatRef.current, userText);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: res, timestamp: Date.now() }]);
    }
    setLoading(false);
  };

  const currentTheme = ADVISORS[advisor];

  return (
    <div className="flex flex-col h-screen pb-20 bg-void">
      <Header title="Consult" subtitle={advisor} rightAction={<button onClick={() => { localStorage.removeItem(getStorageKey(advisor)); switchAdvisor(advisor); }} className="text-slate-600 hover:text-red-500 transition-colors"><IconTrash className="w-5 h-5" /></button>} />
      
      <div className="flex overflow-x-auto p-4 gap-3 bg-black/50 backdrop-blur sticky top-20 z-30 scrollbar-hide">
        {Object.keys(ADVISORS).map((t) => (
          <button key={t} onClick={() => switchAdvisor(t as any)} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all flex-shrink-0 ${advisor === t ? 'bg-white text-black border-white scale-105' : 'text-slate-500 border-slate-800'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[85%] p-4 text-sm leading-relaxed ${m.role === 'user' ? 'bg-slate-900 text-white rounded-lg rounded-br-none' : `${currentTheme.bg} ${currentTheme.color} ${currentTheme.border} border rounded-lg rounded-bl-none font-serif`}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className={`${currentTheme.color} text-[10px] animate-pulse ml-4 font-mono`}>TRANSMITTING...</div>}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 border-t border-slate-900 bg-black/80 backdrop-blur safe-pb">
         <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none focus:border-white transition-colors rounded-sm" placeholder="Inquire..." />
            <button onClick={handleSend} disabled={loading} className="bg-white text-black w-14 flex items-center justify-center hover:bg-slate-200 transition-colors rounded-sm"><IconSend className="w-5 h-5" /></button>
         </div>
      </div>
    </div>
  );
};
