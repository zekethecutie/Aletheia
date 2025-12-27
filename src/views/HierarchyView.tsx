import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { supabase } from '../services/supabaseClient';

interface RankedUser {
  id: string;
  username: string;
  level: number;
  class: string;
  xp: number;
  intelligence: number;
  physical: number;
  spiritual: number;
  social: number;
  wealth: number;
  avatar_url?: string;
  rank?: number;
}

export const HierarchyView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'level' | 'intelligence' | 'physical' | 'spiritual' | 'social' | 'wealth'>('level');

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, stats, avatar_url')
        .not('stats', 'is', null)
        .order('stats->>level', { ascending: false });

      if (data) {
        const ranked = data.map((user: any, index: number) => ({
          id: user.id,
          username: user.username,
          level: user.stats?.level || 1,
          class: user.stats?.class || 'Seeker',
          xp: user.stats?.xp || 0,
          intelligence: user.stats?.intelligence || 0,
          physical: user.stats?.physical || 0,
          spiritual: user.stats?.spiritual || 0,
          social: user.stats?.social || 0,
          wealth: user.stats?.wealth || 0,
          avatar_url: user.avatar_url,
          rank: index + 1
        }));

        // Sort by selected stat
        const sorted = [...ranked].sort((a, b) => {
          const aVal = a[sortBy];
          const bVal = b[sortBy];
          return bVal - aVal;
        });

        // Re-rank after sort
        const reRanked = sorted.map((user, index) => ({ ...user, rank: index + 1 }));
        setLeaderboard(reRanked);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
    setLoading(false);
  };

  const getRankColor = (rank: number | undefined): string => {
    if (!rank) return 'text-slate-400';
    if (rank === 1) return 'text-gold';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-slate-500';
  };

  const getRankBgColor = (rank: number | undefined): string => {
    if (!rank) return 'bg-slate-900';
    if (rank === 1) return 'bg-amber-900/30 border-gold/30';
    if (rank === 2) return 'bg-slate-800/30 border-slate-500/30';
    if (rank === 3) return 'bg-orange-900/20 border-orange-700/30';
    return 'bg-slate-900/20 border-slate-800/30';
  };

  const statColors: Record<string, string> = {
    level: 'text-white',
    intelligence: 'text-blue-400',
    physical: 'text-red-400',
    spiritual: 'text-purple-400',
    social: 'text-cyan-400',
    wealth: 'text-yellow-500'
  };

  return (
    <div className="min-h-screen bg-void pb-24 font-sans text-slate-200 relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-slate-900/20 to-black pointer-events-none"></div>
      
      <Header title="Hierarchy" subtitle="The Great Ascension" />

      <div className="p-6 relative z-10 max-w-4xl mx-auto">
        {/* Stat Filter Buttons */}
        <div className="flex gap-3 mb-10 flex-wrap justify-center">
          {(['level', 'intelligence', 'physical', 'spiritual', 'social', 'wealth'] as const).map((stat) => (
            <button
              key={stat}
              onClick={() => setSortBy(stat)}
              className={`px-6 py-2 rounded-full text-[9px] font-display font-black uppercase tracking-[0.2em] transition-all border ${
                sortBy === stat
                  ? `text-white bg-slate-800 border-white/20`
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {stat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
              <p className="text-indigo-400 text-xs font-black uppercase tracking-widest">Scanning the hierarchy...</p>
            </div>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm">No seekers yet. Be the first to ascend.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div
                key={user.id}
                className={`glass-card transition-all p-6 rounded-2xl hover:border-gold/30 group ${getRankBgColor(user.rank)}`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`text-center min-w-[50px] ${getRankColor(user.rank)}`}>
                    <div className="text-xl font-display font-black"># {user.rank}</div>
                    {user.rank === 1 && <span className="text-[8px] text-gold font-display font-black uppercase tracking-widest">APEX</span>}
                    {user.rank === 2 && <span className="text-[8px] text-slate-300 font-display font-black uppercase tracking-widest">ASCENDED</span>}
                    {user.rank === 3 && <span className="text-[8px] text-orange-400 font-display font-black uppercase tracking-widest">ELITE</span>}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-12 h-12 rounded-full border border-slate-700 object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center text-lg">
                        👤
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-display font-black uppercase tracking-widest text-sm">{user.username}</h3>
                    <p className="text-[9px] text-slate-400 font-display font-black uppercase tracking-[0.2em]">{user.class}</p>
                  </div>

                  {/* Level */}
                  <div className="text-right min-w-[80px]">
                    <div className="text-xl font-display font-black text-white uppercase tracking-tighter">Lvl {user.level}</div>
                    <div className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">{user.xp} XP</div>
                  </div>

                  {/* Sort Stat */}
                  <div className={`text-right min-w-[60px] font-black text-lg ${statColors[sortBy]}`}>
                    {user[sortBy]}
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="mt-4 grid grid-cols-5 gap-3 text-center text-[8px]">
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5 group-hover:border-blue-500/20 transition-all">
                    <div className="text-blue-400 font-display font-black uppercase tracking-widest mb-1">{user.intelligence}</div>
                    <div className="text-slate-600 font-bold uppercase tracking-widest">INT</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5 group-hover:border-red-500/20 transition-all">
                    <div className="text-red-400 font-display font-black uppercase tracking-widest mb-1">{user.physical}</div>
                    <div className="text-slate-600 font-bold uppercase tracking-widest">PHY</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5 group-hover:border-purple-500/20 transition-all">
                    <div className="text-purple-400 font-display font-black uppercase tracking-widest mb-1">{user.spiritual}</div>
                    <div className="text-slate-600 font-bold uppercase tracking-widest">SPI</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5 group-hover:border-cyan-500/20 transition-all">
                    <div className="text-cyan-400 font-display font-black uppercase tracking-widest mb-1">{user.social}</div>
                    <div className="text-slate-600 font-bold uppercase tracking-widest">SOC</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5 group-hover:border-yellow-500/20 transition-all">
                    <div className="text-yellow-500 font-display font-black uppercase tracking-widest mb-1">{user.wealth}</div>
                    <div className="text-slate-600 font-bold uppercase tracking-widest">WEL</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
