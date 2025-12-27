
import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { IconSearch, IconUser, IconScroll, IconResonance, IconSpirit } from '../components/Icons';
import { supabase } from '../services/supabaseClient';
import { SearchResult } from '../types';

export const ExploreView: React.FC = () => {
  const [tab, setTab] = useState<'SEARCH' | 'HIERARCHY'>('SEARCH');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const dbResults: SearchResult[] = [];
    const { data: users } = await supabase.from('profiles').select('*').or(`username.ilike.%${query}%,manifesto.ilike.%${query}%`).limit(10);
    if (users) users.forEach(u => dbResults.push({ type: 'USER', title: u.username, subtitle: u.stats?.class || 'Seeker', content: u.manifesto, avatar: u.avatar_url, id: u.id }));
    const { data: posts } = await supabase.from('posts').select(`*, profiles(username, stats)`).ilike('content', `%${query}%`).limit(10);
    if (posts) posts.forEach(p => dbResults.push({ type: 'POST', title: `Signal from ${p.profiles?.username}`, subtitle: `${p.resonance} Resonance`, content: p.content, id: p.id }));
    setResults(dbResults);
    setSearching(false);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('profiles').select('*').order('stats->level', { ascending: false }).limit(20);
    if (data) setLeaderboard(data);
  };

  useEffect(() => { 
    if (tab === 'HIERARCHY') fetchLeaderboard();
  }, [tab]);

  return (
    <div className="min-h-screen bg-void pb-24">
      <Header title="Explore" subtitle="The Collective" />
      
      <div className="flex border-b border-slate-900 sticky top-20 z-30 bg-black/90">
         <button onClick={() => setTab('SEARCH')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${tab === 'SEARCH' ? 'text-white border-b-2 border-white' : 'text-slate-600'}`}>Deep Scan</button>
         <button onClick={() => setTab('HIERARCHY')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest ${tab === 'HIERARCHY' ? 'text-white border-b-2 border-white' : 'text-slate-600'}`}>Hierarchy</button>
      </div>

      {tab === 'SEARCH' ? (
        <div className="animate-fade-in">
          <div className="px-6 py-6 flex gap-2">
             <div className="flex-1 relative">
                 <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 text-white text-sm outline-none focus:border-gold transition-colors" placeholder="Scan designations or content..." />
                 <IconSearch className="absolute left-4 top-4 text-slate-500 w-5 h-5" />
             </div>
             <button onClick={handleSearch} disabled={searching} className="bg-white text-black font-black uppercase text-[10px] px-6 transition-transform active:scale-95">Seek</button>
          </div>
          <div className="p-6 space-y-4">
             {results.map((res, idx) => (
                 <div key={idx} className="bg-slate-950 border border-slate-900 p-6 hover:border-gold/30 transition-all cursor-pointer rounded-sm group">
                     <div className="flex items-start gap-4">
                         <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 overflow-hidden">
                             {res.avatar ? <img src={res.avatar} className="w-full h-full object-cover" /> : res.type === 'USER' ? <IconUser className="w-5 h-5" /> : <IconScroll className="w-5 h-5" />}
                         </div>
                         <div className="flex-1">
                             <h3 className="text-white font-black text-sm uppercase group-hover:text-gold transition-colors">{res.title}</h3>
                             <p className="text-gold text-[10px] uppercase font-bold tracking-widest mt-1">{res.subtitle}</p>
                             {res.content && <p className="text-slate-400 text-xs font-serif mt-3 line-clamp-2 italic">"{res.content}"</p>}
                         </div>
                     </div>
                 </div>
             ))}
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-3 animate-fade-in">
          {leaderboard.map((user, idx) => (
            <div key={user.id} className="flex items-center gap-4 bg-slate-950 border border-slate-900 p-4 relative overflow-hidden group">
               <div className={`text-xl font-black w-10 text-center ${idx < 3 ? 'text-gold' : 'text-slate-700'}`}>{idx + 1}</div>
               <img src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=000000`} className="w-12 h-12 rounded-full border border-slate-800 bg-black" />
               <div className="flex-1">
                 <h4 className="text-white font-black uppercase text-sm">{user.username}</h4>
                 <p className="text-gold text-[10px] font-bold uppercase tracking-widest">{user.stats?.class || 'Seeker'}</p>
               </div>
               <div className="text-right">
                 <div className="text-white font-black text-sm">LVL {user.stats?.level}</div>
                 <div className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">{user.entropy || 0} RES</div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
