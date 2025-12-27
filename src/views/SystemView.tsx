
import React, { useState } from 'react';
import { User, DailyTask, Artifact } from '../types';
import { apiClient } from '../services/apiClient';
import { IconSettings, IconPlus, IconEye, IconLock, IconTrash, IconMirror } from '../components/Icons';
import { SettingsModal } from '../components/modals/SettingsModal';
import { getRank, getRankColor } from '../utils/helpers';

// --- Sub-components ---

const StatHex: React.FC<{ label: string; value: number; color: string; description?: string; activeAnalysis: boolean }> = ({ label, value, color, description, activeAnalysis }) => (
  <div className="relative group transition-all duration-500">
     <div className={`flex flex-col items-center justify-center p-4 glass-card rounded-2xl border-white/5 hover:border-gold/30 transition-all ${activeAnalysis ? 'opacity-20 blur-md' : 'opacity-100'}`}>
        <div className="relative">
            <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-white/5" />
                <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" className={color} strokeDasharray={`${(value / 100) * 188.5} 188.5`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-black font-mono tracking-tighter ${color}`}>{value}</span>
            </div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-4 font-sans">{label}</span>
     </div>
     
     {activeAnalysis && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-black/90 border border-gold/30 p-3 rounded shadow-[0_0_30px_rgba(212,175,55,0.2)] w-40 text-center animate-fade-in-up z-30 relative backdrop-blur-xl">
                <p className={`text-[10px] font-black uppercase ${color} mb-2 tracking-[0.1em]`}>{label} ANALYTICS</p>
                <p className="text-[9px] text-slate-300 leading-relaxed font-serif italic">"{description}"</p>
            </div>
        </div>
     )}
  </div>
);

const ArtifactCard: React.FC<{ artifact: Artifact }> = ({ artifact }) => {
    const rarityColors: Record<string, string> = {
        'COMMON': 'border-slate-800 text-slate-500',
        'RARE': 'border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
        'LEGENDARY': 'border-gold/50 text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]',
        'MYTHIC': 'border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
    };

    const rarityKey = (artifact.rarity || 'COMMON').toUpperCase();
    const colorClass = rarityColors[rarityKey] || rarityColors['COMMON'];
    const textColor = colorClass.split(' ')[1] || 'text-slate-500';

    return (
        <div className={`aspect-square bg-slate-950 border ${colorClass} p-2 flex flex-col items-center justify-center text-center relative group overflow-hidden cursor-pointer hover:bg-slate-900 transition-colors`}>
            {artifact.imageUrl ? (
                <div className="w-full h-full absolute inset-0 opacity-80 group-hover:scale-110 transition-transform duration-500">
                    <img src={artifact.imageUrl} className="w-full h-full object-cover" alt={artifact.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                </div>
            ) : (
                <div className="text-3xl mb-2 filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">{artifact.icon || '📦'}</div>
            )}
            
            <div className="text-[8px] font-black uppercase tracking-wide truncate w-full px-1 z-10 relative mt-auto mb-1 drop-shadow-md">{artifact.name}</div>
            
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 backdrop-blur-sm pointer-events-none">
                <p className={`text-[8px] font-bold uppercase mb-2 ${textColor}`}>{artifact.rarity}</p>
                <p className="text-[9px] text-white leading-tight mb-2 font-serif italic line-clamp-3">"{artifact.description}"</p>
                <div className="h-[1px] w-4 bg-slate-700 mb-2"></div>
                <p className="text-[8px] text-green-400 font-mono uppercase">{artifact.effect}</p>
            </div>
        </div>
    );
};

export const SystemView: React.FC<{ user: User; onUpdateUser: (u: User) => void; onLogout: () => void }> = ({ user, onUpdateUser, onLogout }) => {
  const [tab, setTab] = useState<'STATUS' | 'QUESTS' | 'INVENTORY'>('STATUS');
  const [taskInput, setTaskInput] = useState('');
  const [featInput, setFeatInput] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyzeMode, setAnalyzeMode] = useState(false);
  const [generatingQuest, setGeneratingQuest] = useState(false);

  const rank = getRank(user.stats.level);
  const xpPercent = (user.stats.xp / user.stats.xpToNextLevel) * 100;

  const addTask = (type: 'DAILY' | 'HABIT') => {
    if (!taskInput) return;
    const newTask: DailyTask = { 
        id: Date.now().toString(), 
        text: taskInput, 
        completed: false, 
        type: type,
        streak: 0,
        difficulty: 'E'
    };
    onUpdateUser({ ...user, tasks: [...user.tasks, newTask] });
    setTaskInput('');
  };

  const toggleTask = (id: string) => {
    const updated = user.tasks.map(t => {
        if (t.id === id) {
             if (t.type === 'HABIT') {
                 return { ...t, streak: (t.streak || 0) + 1 };
             }
             return { ...t, completed: !t.completed };
        }
        return t;
    });
    onUpdateUser({ ...user, tasks: updated });
  };

  const removeTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = user.tasks.filter(t => t.id !== id);
    onUpdateUser({ ...user, tasks: updated });
  };

  const submitFeat = async () => {
    setCalculating(true);
    try {
      const res = await apiClient.calculateFeat(featInput, user.stats);
      
      let newXp = user.stats.xp + res.xpGained;
      let newLevel = user.stats.level;
      let nextXp = user.stats.xpToNextLevel;
      if (newXp >= nextXp) { newLevel += 1; newXp -= nextXp; nextXp = Math.floor(nextXp * 1.2); }

      const newStats = { ...user.stats, xp: newXp, level: newLevel, xpToNextLevel: nextXp };
      if (res.statsIncreased) {
        if (res.statsIncreased.wealth) newStats.wealth = (newStats.wealth || 0) + res.statsIncreased.wealth;
        if (res.statsIncreased.physical) newStats.physical = (newStats.physical || 0) + res.statsIncreased.physical;
        if (res.statsIncreased.spiritual) newStats.spiritual = (newStats.spiritual || 0) + res.statsIncreased.spiritual;
        if (res.statsIncreased.intelligence) newStats.intelligence = (newStats.intelligence || 0) + res.statsIncreased.intelligence;
        if (res.statsIncreased.social) newStats.social = (newStats.social || 0) + res.statsIncreased.social;
      }

      onUpdateUser({ ...user, stats: newStats });
      setFeatInput('');
      alert(`SYSTEM ALERT:\n${res.systemMessage}`);
    } catch (error) {
      console.error('Feat analysis failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="min-h-screen bg-void pb-24 font-sans text-slate-200">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

      <div className="relative w-full h-56 bg-slate-950 group">
          <div className="absolute inset-0 z-0 overflow-hidden">
             {user.coverUrl ? (
                 <img src={user.coverUrl} className="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105" />
             ) : (
                 <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black"></div>
             )}
             <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent"></div>
          </div>

          <button onClick={() => setShowSettings(true)} className="absolute top-6 right-6 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-colors z-20 border border-white/10">
             <IconSettings className="w-5 h-5" />
          </button>

          <div className="absolute -bottom-10 left-6 z-20">
             <div className="w-24 h-24 rounded-xl bg-black border-2 border-gold p-1 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
                <img 
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=000000`} 
                    className="w-full h-full object-cover rounded-lg bg-slate-900"
                />
                <div className="absolute -bottom-2 -right-2 bg-black border border-gold text-gold text-[10px] font-black px-2 py-0.5 rounded-full">
                    LVL {user.stats.level}
                </div>
             </div>
          </div>
      </div>

      <div className="mt-16 px-8 mb-12">
         <div className="flex gap-12 items-start">
            <div className="relative">
                <div className="w-48 h-56 bg-gradient-to-br from-gold/40 via-gold/10 to-transparent rounded-2xl p-0.5 shadow-[0_20px_50px_rgba(255,149,0,0.1)]">
                    <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent opacity-50"></div>
                        <div className="absolute top-4 left-0 right-0 flex justify-center">
                            <div className="w-32 h-32 glass-card rounded-xl border-white/10 p-2 relative">
                                <img 
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=000000`} 
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black border border-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
                                    LVL {user.stats.level}
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-1">{user.username}</h2>
                            <p className="text-gold text-[9px] uppercase font-black tracking-[0.3em] opacity-80">{user.title || user.stats.class || "SCHOLAR"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-6 max-w-md pt-4">
                <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-2">
                        <span className="text-slate-500">Health Point</span>
                        <span className="text-slate-300">{user.stats.health || 85} / {user.stats.maxHealth || 100}</span>
                    </div>
                    <div className="stats-bar">
                        <div className="stats-bar-fill bg-red-500/80" style={{ width: `${((user.stats.health || 85) / (user.stats.maxHealth || 100)) * 100}%` }}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-2">
                        <span className="text-slate-500">Resonance</span>
                        <span className="text-slate-300">{user.stats.resonance || 120} / {user.stats.maxResonance || 150}</span>
                    </div>
                    <div className="stats-bar">
                        <div className="stats-bar-fill bg-blue-500/80" style={{ width: `${((user.stats.resonance || 120) / (user.stats.maxResonance || 150)) * 100}%` }}></div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-2">
                        <span className="text-slate-500">Experience</span>
                        <span className="text-slate-300">{user.stats.xp} / {user.stats.xpToNextLevel}</span>
                    </div>
                    <div className="stats-bar">
                        <div className="stats-bar-fill bg-gold/80" style={{ width: `${xpPercent}%` }}></div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="flex px-4 gap-2 mb-8">
         {['SYSTEM', 'ACHIEVEMENTS', 'STATS'].map(t => (
             <button 
                key={t}
                onClick={() => setTab(t === 'STATS' ? 'STATUS' : (t === 'SYSTEM' ? 'QUESTS' : 'INVENTORY'))} 
                className={`flex-1 py-2 rounded-full text-[10px] font-display font-black uppercase tracking-[0.2em] transition-all border ${tab === (t === 'STATS' ? 'STATUS' : (t === 'SYSTEM' ? 'QUESTS' : 'INVENTORY')) ? 'bg-slate-800 text-white border-white/20' : 'bg-transparent text-slate-600 border-transparent hover:text-slate-400'}`}
             >
                {t}
             </button>
         ))}
      </div>

      <div className="p-6 pt-6">
          {tab === 'STATUS' && (
              <div className="animate-fade-in space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4 rounded-xl border-white/5 flex justify-between items-center group hover:border-gold/30 transition-all">
                        <div>
                            <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-gold rounded-full"></div>
                                Physical
                            </div>
                            <div className="text-2xl font-display font-black text-white">{user.stats.physical}</div>
                        </div>
                        <div className="w-6 h-6 opacity-20 group-hover:opacity-100 transition-opacity">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                        </div>
                      </div>
                      <div className="glass-card p-4 rounded-xl border-white/5 flex justify-between items-center group hover:border-gold/30 transition-all">
                        <div>
                            <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-gold rounded-full"></div>
                                Intelligence
                            </div>
                            <div className="text-2xl font-display font-black text-white">{user.stats.intelligence}</div>
                        </div>
                        <div className="w-6 h-6 opacity-20 group-hover:opacity-100 transition-opacity">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 16v-4M12 8h.01" />
                            </svg>
                        </div>
                      </div>
                      <div className="glass-card p-4 rounded-xl border-white/5 flex justify-between items-center group hover:border-gold/30 transition-all">
                        <div>
                            <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-gold rounded-full"></div>
                                Social
                            </div>
                            <div className="text-2xl font-display font-black text-white">{user.stats.social}</div>
                        </div>
                        <div className="w-6 h-6 opacity-20 group-hover:opacity-100 transition-opacity">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                      </div>
                      <div className="glass-card p-4 rounded-xl border-white/5 flex justify-between items-center group hover:border-gold/30 transition-all">
                        <div>
                            <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-gold rounded-full"></div>
                                Spiritual
                            </div>
                            <div className="text-2xl font-display font-black text-white">{user.stats.spiritual}</div>
                        </div>
                        <div className="w-6 h-6 opacity-20 group-hover:opacity-100 transition-opacity">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
                                <path d="M12 15l-2 5L3 9l18-6-5 18-4-6z" />
                            </svg>
                        </div>
                      </div>
                  </div>

                  <div className="border border-slate-800 bg-slate-950 p-6 relative group">
                      <div className="absolute -left-1 top-4 bottom-4 w-1 bg-gold"></div>
                      <h3 className="text-sm font-bold text-white uppercase mb-4 tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          Log Achievement
                      </h3>
                      <textarea 
                        value={featInput} 
                        onChange={e => setFeatInput(e.target.value)} 
                        className="w-full h-24 bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none mb-4 focus:border-gold transition-colors placeholder-slate-600 font-mono" 
                        placeholder="State your feat, Seeker..." 
                      />
                      <button 
                        onClick={submitFeat} 
                        disabled={calculating} 
                        className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors"
                      >
                        {calculating ? 'Analyzing...' : 'Submit to System'}
                      </button>
                  </div>
              </div>
          )}

          {tab === 'QUESTS' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">Active Quests</h2>
                      <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Cycle 4 // Day 12</div>
                  </div>

                  <div className="space-y-4">
                      {user.tasks.map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => toggleTask(t.id)}
                            className={`glass-card p-6 rounded-xl flex items-center justify-between cursor-pointer transition-all relative overflow-hidden group ${t.completed ? 'opacity-40' : 'hover:border-gold/50'}`}
                          >
                              <div className="flex items-center gap-6">
                                  <div className="w-10 h-10 glass-card rounded-lg flex items-center justify-center border-white/10 group-hover:border-gold/30">
                                      <div className="w-4 h-4 border border-slate-500 rounded-full flex items-center justify-center">
                                          <div className="w-1.5 h-1.5 border border-slate-500 rounded-full"></div>
                                      </div>
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-display font-black text-gold uppercase tracking-[0.2em] mb-1">{t.type === 'HABIT' ? 'Stamina Boost' : 'Skill Upgrade'}</p>
                                     <p className="text-sm font-bold text-white tracking-wide">{t.text}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="text-right">
                                      <p className="text-[10px] font-mono text-slate-400 uppercase">+{t.difficulty === 'S' ? '1000' : '450'} EXP</p>
                                      <div className="w-16 h-[2px] bg-white/10 mt-1">
                                          <div className="h-full bg-white/40" style={{ width: t.completed ? '100%' : '30%' }}></div>
                                      </div>
                                  </div>
                                  <button onClick={(e) => removeTask(t.id, e)} className="text-slate-700 hover:text-red-500 p-2"><IconTrash className="w-4 h-4" /></button>
                              </div>
                          </div>
                      ))}
                      
                      <div className="flex gap-2 mt-8">
                        <input 
                            value={taskInput} 
                            onChange={e => setTaskInput(e.target.value)} 
                            className="flex-1 bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none focus:border-gold transition-colors placeholder-slate-600 rounded-lg font-mono" 
                            placeholder="State new directive..." 
                        />
                        <button onClick={() => addTask('DAILY')} className="px-6 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors rounded-lg">
                            Deploy
                        </button>
                      </div>
                  </div>
              </div>
          )}

          {tab === 'INVENTORY' && (
              <div className="animate-fade-in space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                        <IconLock className="w-3 h-3" /> Mental Artifacts
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {user.inventory && user.inventory.length > 0 ? (
                            user.inventory.map((item, i) => <ArtifactCard key={item.id || i} artifact={item} />)
                        ) : (
                            <div className="col-span-3 flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 text-slate-600 text-[10px] uppercase rounded-lg">
                                <IconMirror className="w-6 h-6 mb-2 text-slate-700" />
                                <span>The void is empty.</span>
                                <span className="mt-1">Enter The Mirror to manifest self.</span>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24 px-6">
          <div className="glass-card p-8 rounded-2xl border-white/5 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 glass-card rounded-lg flex items-center justify-center border-gold/20">
                      <div className="w-5 h-5 border-2 border-gold rounded rotate-45"></div>
                  </div>
                  <div>
                      <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">Recent Achievement</h3>
                      <p className="text-[10px] text-gold font-bold uppercase tracking-widest opacity-60">System Notification</p>
                  </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-serif italic mb-4">
                  "You've reached a 14-day streak in Daily Manifestation. +5 Luck attribute permanently assigned."
              </p>
              <div className="w-full h-[1px] bg-white/5"></div>
          </div>

          <div className="glass-card p-8 rounded-2xl border-white/5 relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 glass-card rounded-lg flex items-center justify-center border-blue-500/20">
                      <div className="w-5 h-5 border-2 border-blue-500 rounded-full"></div>
                  </div>
                  <div>
                      <h3 className="text-lg font-display font-black text-white uppercase tracking-widest">Safety Protocol</h3>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest opacity-60">AI Monitor Active</p>
                  </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-serif italic mb-4">
                  "System integrity at 98%. AI monitoring suggests resting within the next 4 hours to avoid HP drain."
              </p>
              <div className="w-full h-[1px] bg-white/5"></div>
          </div>
      </div>

      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
      
      <div className="fixed bottom-32 right-6 z-40">
        <button 
          onClick={onLogout}
          className="px-6 py-3 bg-red-900/20 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-900/40 hover:border-red-500 transition-all rounded-lg"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};
