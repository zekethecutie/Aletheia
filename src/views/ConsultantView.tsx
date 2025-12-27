
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { createAdvisorSession, askAdvisor } from '../services/geminiService';
import { Chat } from "@google/genai";
import { Header } from '../components/Header';
import { IconSend, IconTrash } from '../components/Icons';
import { loadUser } from '../utils/helpers';

const ADVISORS = {
  ORACLE: { 
    desc: "Interpretation of truth and void.", 
    color: "text-indigo-400", 
    aura: "shadow-[0_0_50px_rgba(99,102,241,0.2)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Oracle&backgroundColor=000000"
  },
  STRATEGIST: { 
    desc: "Optimization and cold logic.", 
    color: "text-cyan-400", 
    aura: "shadow-[0_0_50px_rgba(34,211,238,0.2)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Strategist&backgroundColor=000000"
  },
  TITAN: { 
    desc: "Discipline and physical mastery.", 
    color: "text-rose-500", 
    aura: "shadow-[0_0_50px_rgba(244,63,94,0.2)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Titan&backgroundColor=000000"
  },
  MYSTIC: { 
    desc: "Emotional intelligence and soul.", 
    color: "text-emerald-400", 
    aura: "shadow-[0_0_50px_rgba(52,211,153,0.2)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Mystic&backgroundColor=000000"
  }
};

export const ConsultantView: React.FC = () => {
  const [advisor, setAdvisor] = useState<keyof typeof ADVISORS>('ORACLE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentUser = loadUser();

  const currentTheme = ADVISORS[advisor];

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

  const formatMessage = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-screen pb-20 bg-void relative overflow-hidden">
      <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 ${currentTheme.aura.replace('shadow-', 'bg-').replace('rgba', 'rgba').replace('0.2', '0.05')}`}></div>
      
      <Header title="Consult" subtitle={advisor} rightAction={<button onClick={() => { localStorage.removeItem(getStorageKey(advisor)); switchAdvisor(advisor); }} className="text-slate-600 hover:text-red-500 transition-colors"><IconTrash className="w-5 h-5" /></button>} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Advisor Avatar Area */}
        <div className="h-64 flex flex-col items-center justify-center p-8 animate-fade-in relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black z-0"></div>
          
          <div className="relative group mb-4">
             {/* Aura Animations */}
             <div className={`absolute inset-[-40px] rounded-full blur-3xl opacity-20 animate-pulse-slow ${currentTheme.aura.replace('shadow-', 'bg-').split('_')[1].split(',')[0].replace('rgba(', '')}`}></div>
             <div className={`absolute inset-[-20px] rounded-full border border-white/10 animate-spin-slow`}></div>
             
             <div className={`w-32 h-32 glass-card rounded-2xl flex items-center justify-center relative z-10 p-4 border-white/5 ${currentTheme.aura}`}>
                <img src={currentTheme.icon} className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" alt={advisor} />
             </div>
          </div>
          
          <div className="text-center relative z-10">
             <h2 className={`text-2xl font-black uppercase tracking-[0.4em] ${currentTheme.color}`}>{advisor}</h2>
             <p className="text-[8px] text-slate-500 uppercase font-bold tracking-[0.2em] mt-2 max-w-[200px] leading-relaxed mx-auto">{currentTheme.desc}</p>
          </div>
        </div>

        {/* Advisor Selection Tabs */}
        <div className="flex overflow-x-auto px-6 py-4 gap-4 bg-black/40 backdrop-blur-xl border-y border-white/5 scrollbar-hide">
          {Object.keys(ADVISORS).map((t) => (
            <button key={t} onClick={() => switchAdvisor(t as any)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-[0.3em] transition-all flex-shrink-0 rounded-lg border ${advisor === t ? 'bg-white text-black border-white' : 'text-slate-600 border-white/5 hover:border-white/20'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              {m.role === 'model' && (
                <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center mr-3 mt-1 shrink-0 border-white/5">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${currentTheme.color.replace('text-', 'bg-')}`}></div>
                </div>
              )}
              <div className={`max-w-[85%] p-5 text-sm leading-relaxed tracking-wide ${m.role === 'user' ? 'glass-card border-white/10 text-white rounded-2xl rounded-tr-none' : `text-slate-300 font-serif italic border-l-2 border-gold/20 pl-6`}`}>
                {formatMessage(m.text)}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex items-center gap-3 ml-11">
                <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-gold/50 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-black/80 backdrop-blur-2xl safe-pb relative z-20">
         <div className="flex gap-4 glass-card p-2 rounded-2xl border-white/10">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} className="flex-1 bg-transparent p-4 text-white text-sm outline-none placeholder-slate-700 font-sans" placeholder="Type your inquiry..." />
            <button onClick={handleSend} disabled={loading} className="bg-gold text-black w-14 h-14 flex items-center justify-center hover:bg-gold-light transition-all rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] active:scale-95 disabled:opacity-50"><IconSend className="w-6 h-6" /></button>
         </div>
      </div>
    </div>
  );
};
