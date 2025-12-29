
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { apiClient } from '../services/apiClient';
import { Header } from '../components/Header';
import { IconSend, IconTrash } from '../components/Icons';
import { loadUser } from '../utils/helpers';

const ADVISORS = {
  ORACLE: { 
    desc: "The watcher of threads and truth.", 
    color: "text-emerald-400", 
    aura: "bg-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.3)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Oracle&backgroundColor=000000&shape1Color=10b981"
  },
  STRATEGIST: { 
    desc: "Cold logic for a complex world.", 
    color: "text-orange-400", 
    aura: "bg-orange-500/10 shadow-[0_0_50px_rgba(249,115,22,0.3)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Strategist&backgroundColor=000000&shape1Color=f97316"
  },
  TITAN: { 
    desc: "The absolute law of discipline.", 
    color: "text-red-500", 
    aura: "bg-red-600/10 shadow-[0_0_50px_rgba(220,38,38,0.3)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Titan&backgroundColor=000000&shape1Color=dc2626"
  },
  MYSTIC: { 
    desc: "The heartbeat of the unseen collective.", 
    color: "text-purple-400", 
    aura: "bg-purple-500/10 shadow-[0_0_50px_rgba(168,85,247,0.3)]",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=Mystic&backgroundColor=000000&shape1Color=a855f7"
  }
};

export const ConsultantView: React.FC = () => {
  const [advisor, setAdvisor] = useState<keyof typeof ADVISORS>('ORACLE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
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
      setMessages([{ id: 'init', role: 'model', text: `Initiate signal, Seeker. I await the frequency.`, timestamp: Date.now() }]);
    }
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
    
    try {
      const res = await apiClient.askAdvisor(advisor, userText, currentUser?.id || '');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: res.text || "Signal lost...", timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "The void remains silent.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
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
      {/* 4D Background Aura */}
      <div className={`fixed inset-0 pointer-events-none transition-all duration-1000 blur-[120px] opacity-30 ${currentTheme.aura.split(' ')[0]}`}></div>
      
      <Header title="The Council" subtitle={advisor} rightAction={<button onClick={() => { localStorage.removeItem(getStorageKey(advisor)); switchAdvisor(advisor); }} className="text-slate-600 hover:text-red-500 transition-colors"><IconTrash className="w-5 h-5" /></button>} />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        
        {/* Mystic Avatar Area (Floating 4D Effect) */}
        <div className="h-72 flex flex-col items-center justify-center p-8 animate-fade-in relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-0"></div>
          
          <div className="relative group mb-6">
             {/* 4D Ripple Auras */}
             <div className={`absolute inset-[-60px] rounded-full blur-3xl opacity-40 animate-pulse-slow ${currentTheme.aura.split(' ')[0]}`}></div>
             <div className={`absolute inset-[-40px] rounded-full border-2 border-white/5 animate-[spin_10s_linear_infinite]`}></div>
             <div className={`absolute inset-[-20px] rounded-full border border-white/10 animate-[spin_15s_linear_infinite_reverse]`}></div>
             
             {/* Floating Avatar Body */}
             <div className={`w-40 h-40 glass-card rounded-3xl flex items-center justify-center relative z-10 p-6 border-white/5 animate-float shadow-[0_0_80px_rgba(255,255,255,0.05)] ${currentTheme.aura.split(' ')[1]}`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-3xl"></div>
                <img src={currentTheme.icon} className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" alt={advisor} />
             </div>
          </div>
          
          <div className="text-center relative z-10 animate-fade-in">
             <h2 className={`text-3xl font-black uppercase tracking-[0.6em] ${currentTheme.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] font-sans`}>{advisor}</h2>
             <div className="flex items-center justify-center gap-4 mt-3">
                <div className="h-[1px] w-8 bg-white/10"></div>
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-[0.3em] max-w-[220px] leading-relaxed italic">"{currentTheme.desc}"</p>
                <div className="h-[1px] w-8 bg-white/10"></div>
             </div>
          </div>
        </div>

        {/* Council Frequency Selector */}
        <div className="flex px-6 py-4 gap-2 bg-black/60 backdrop-blur-2xl border-y border-white/5 overflow-x-hidden">
          {Object.keys(ADVISORS).map((t) => {
            const theme = ADVISORS[t as keyof typeof ADVISORS];
            return (
              <button 
                key={t} 
                onClick={() => switchAdvisor(t as any)} 
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all rounded-lg border relative group ${advisor === t ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-slate-600 border-white/5 hover:border-white/20'}`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Signal History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              {m.role === 'model' && (
                <div className="w-8 h-8 rounded-lg glass-card flex items-center justify-center mr-3 mt-1 shrink-0 border-white/10 shadow-lg">
                   <div className={`w-2 h-2 rounded-sm rotate-45 animate-pulse ${currentTheme.color.replace('text-', 'bg-')}`}></div>
                </div>
              )}
              <div className={`max-w-[85%] p-4 text-[14px] leading-relaxed tracking-wide ${m.role === 'user' ? 'glass-card border-white/10 text-white rounded-2xl rounded-tr-none' : `text-slate-300 font-serif italic border-l-2 border-white/10 pl-6 relative`}`}>
                {m.role === 'model' && <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${currentTheme.color.replace('text-', 'bg-')} opacity-40`}></div>}
                {formatMessage(m.text)}
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex items-center gap-3 ml-11">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${currentTheme.color.replace('text-', 'bg-')} opacity-60`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.2s] ${currentTheme.color.replace('text-', 'bg-')} opacity-40`}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.4s] ${currentTheme.color.replace('text-', 'bg-')} opacity-20`}></div>
             </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Transmission Terminal */}
      <div className="p-4 border-t border-white/5 bg-black/90 backdrop-blur-3xl safe-pb relative z-20">
         <div className="flex gap-2 glass-card p-1.5 rounded-2xl border-white/10 shadow-xl">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleSend()} 
              className="flex-1 bg-transparent px-4 py-3 text-white text-[14px] outline-none placeholder-slate-800 font-sans" 
              placeholder="Inquire..." 
            />
            <button 
              onClick={handleSend} 
              disabled={loading} 
              className="bg-white text-black w-12 h-12 flex items-center justify-center hover:bg-slate-200 transition-all rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-90 disabled:opacity-30 group"
            >
              <IconSend className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
         </div>
      </div>
    </div>
  );
};
