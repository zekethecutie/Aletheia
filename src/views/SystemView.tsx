
import React, { useState, useEffect } from 'react';
import { User, Artifact } from '../types';
import { apiClient } from '../services/apiClient';
import { IconSettings, IconLock, IconMirror } from '../components/Icons';
import { SettingsModal } from '../components/modals/SettingsModal';
import { getRank } from '../utils/helpers';

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
  const [tab, setTab] = useState<'STATUS' | 'QUESTS' | 'GOALS' | 'INVENTORY'>('QUESTS');
  const [featInput, setFeatInput] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [generatingQuest, setGeneratingQuest] = useState(false);
  const [quests, setQuests] = useState<any[]>([]);
  const [timer, setTimer] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTimer(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddGoal = async () => {
    if (!goalInput.trim()) return;
    const newGoals = [...(user.goals || []), goalInput];
    try {
      await apiClient.updateProfile(user.id, { goals: newGoals });
      onUpdateUser({ ...user, goals: newGoals });
      setGoalInput('');
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchQuests = async () => {
      try {
        const data = await apiClient.getQuests(user.id);
        setQuests(data);
      } catch (error) {
        console.error('Failed to fetch quests:', error);
      }
    };
    if (tab === 'QUESTS') fetchQuests();
  }, [tab, user.id]);

  const handleGenerateQuests = async () => {
    setGeneratingQuest(true);
    try {
      await apiClient.generateQuests(user.id, user.stats, user.goals);
      const data = await apiClient.getQuests(user.id);
      setQuests(data);
    } catch (error) {
      console.error('Failed to generate quests:', error);
    } finally {
      setGeneratingQuest(false);
    }
  };

  const handleCompleteQuest = async (quest: any) => {
    if (quest.completed) return;
    
    const expiresAt = quest.expires_at ? new Date(quest.expires_at).getTime() : 0;
    if (expiresAt > 0 && Date.now() > expiresAt) {
      alert("This quest has expired. You failed to manifest your will in time.");
      return;
    }

    const confirmed = confirm("Are you sure you had finished the task? Do not lie to the system, it is not us you are fooling — but instead yourself.");
    if (!confirmed) return;

    try {
      const res = await apiClient.completeQuest(quest.id);
      if (res.success) {
        let newXp = user.stats.xp + (res.reward.xp || 100);
        let newLevel = user.stats.level;
        let nextXp = user.stats.xpToNextLevel;
        if (newXp >= nextXp) { newLevel += 1; newXp -= nextXp; nextXp = Math.floor(nextXp * 1.2); }

        const newStats = { ...user.stats, xp: newXp, level: newLevel, xpToNextLevel: nextXp };
        if (res.reward.stats) {
          Object.keys(res.reward.stats).forEach(k => {
            const key = k as keyof typeof newStats;
            if (typeof newStats[key] === 'number') {
                (newStats[key] as any) += res.reward.stats[k];
            }
          });
        }
        onUpdateUser({ ...user, stats: newStats });
        const data = await apiClient.getQuests(user.id);
        setQuests(data);
      }
    } catch (error) {
      console.error('Failed to complete quest:', error);
    }
  };

  const submitFeat = async () => {
    if (!featInput.trim()) return;
    setCalculating(true);
    try {
      const res = await apiClient.calculateFeat(featInput, user.id, user.stats);
      let newXp = user.stats.xp + res.xpGained;
      let newLevel = user.stats.level;
      let nextXp = user.stats.xpToNextLevel;
      if (newXp >= nextXp) { newLevel += 1; newXp -= nextXp; nextXp = Math.floor(nextXp * 1.2); }

      const newStats = { ...user.stats, xp: newXp, level: newLevel, xpToNextLevel: nextXp };
      if (res.statsIncreased) {
        Object.keys(res.statsIncreased).forEach(k => {
          const key = k as keyof typeof newStats;
          if (typeof newStats[key] === 'number') {
            (newStats[key] as any) += res.statsIncreased[k];
          }
        });
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

  const xpPercent = (user.stats.xp / user.stats.xpToNextLevel) * 100;

  return (
    <div className="min-h-screen bg-void pb-24 font-sans text-slate-200">
      <div className="relative w-full h-56 bg-slate-950 group">
          <div className="absolute inset-0 z-0 overflow-hidden">
             {user.coverUrl ? (
                 <img src={user.coverUrl} className="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105" />
             ) : (
                 <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black"></div>
             ) }
             <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent"></div>
          </div>
          <button onClick={() => setShowSettings(true)} className="absolute top-6 right-6 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-white hover:text-black transition-colors z-20 border border-white/10">
             <IconSettings className="w-5 h-5" />
          </button>
      </div>

      <div className="mt-16 px-8 mb-12">
         <div className="flex gap-12 items-start">
            <div className="relative">
                <div className="w-48 h-56 bg-gradient-to-br from-gold/40 via-gold/10 to-transparent rounded-2xl p-0.5 shadow-[0_20px_50px_rgba(255,149,0,0.1)]">
                    <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative group">
                        <div className="absolute top-4 left-0 right-0 flex justify-center">
                            <div className="w-32 h-32 glass-card rounded-xl border-white/10 p-2 relative">
                                <img src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=000000`} className="w-full h-full object-cover rounded-lg" />
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black border border-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap">
                                    LVL {user.stats.level}
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 text-center px-4">
                            <h2 className="text-xl font-display font-black text-white uppercase tracking-tighter mb-1">{user.username}</h2>
                            <p className="text-gold text-[9px] uppercase font-black tracking-[0.3em] opacity-80">{user.stats.class || "SCHOLAR"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 space-y-4 max-w-md pt-4">
                <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1">
                        <span className="text-slate-500">Health Point</span>
                        <span className="text-slate-300">{(user.stats.health || 0).toFixed(0)} / {user.stats.maxHealth || 100}</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 overflow-hidden">
                        <div className="h-full bg-red-500/80 transition-all duration-500" style={{ width: `${Math.min(100, ((user.stats.health || 0) / (user.stats.maxHealth || 100)) * 100)}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1">
                        <span className="text-slate-500">Resonance</span>
                        <span className="text-slate-300">{(user.stats.resonance || 0).toFixed(0)} / {user.stats.maxResonance || 100}</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 overflow-hidden">
                        <div className="h-full bg-blue-500/80 transition-all duration-500" style={{ width: `${Math.min(100, ((user.stats.resonance || 0) / (user.stats.maxResonance || 100)) * 100)}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1">
                        <span className="text-slate-500">Experience</span>
                        <span className="text-slate-300">{user.stats.xp} / {user.stats.xpToNextLevel}</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 overflow-hidden">
                        <div className="h-full bg-gold/80 transition-all duration-500" style={{ width: `${Math.min(100, (user.stats.xp / user.stats.xpToNextLevel) * 100)}%` }}></div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="flex px-4 gap-2 mb-8 overflow-x-auto no-scrollbar">
         {['QUESTS', 'GOALS', 'ACHIEVEMENTS', 'STATS'].map(t => {
             const tabValue = t === 'STATS' ? 'STATUS' : (t === 'QUESTS' ? 'QUESTS' : (t === 'GOALS' ? 'GOALS' : 'INVENTORY'));
             return (
               <button key={t} onClick={() => setTab(tabValue as any)} className={`min-w-[100px] py-2 px-4 rounded-full text-[10px] font-display font-black uppercase tracking-[0.2em] transition-all border ${tab === tabValue ? 'bg-slate-800 text-white border-white/20' : 'bg-transparent text-slate-600 border-transparent hover:text-slate-400'}`}>
                  {t}
               </button>
             );
         })}
      </div>

      <div className="p-6 pt-6">
          {tab === 'STATUS' && (
              <div className="animate-fade-in space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Intelligence', val: user.stats.intelligence, color: 'bg-blue-400' },
                        { label: 'Physical', val: user.stats.physical, color: 'bg-red-500' },
                        { label: 'Spiritual', val: user.stats.spiritual, color: 'bg-purple-400' },
                        { label: 'Social', val: user.stats.social, color: 'bg-amber-400' }
                      ].map(s => (
                        <div key={s.label} className="glass-card p-4 rounded-xl border-white/5 flex justify-between items-center group hover:border-gold/30 transition-all">
                          <div>
                            <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className={`w-1 h-1 ${s.color} rounded-full`}></div>
                                {s.label}
                            </div>
                            <div className="text-2xl font-display font-black text-white">{s.val}</div>
                          </div>
                        </div>
                      ))}
                      <div className="glass-card p-4 rounded-xl border-white/5 flex justify-between items-center group hover:border-gold/30 transition-all col-span-2">
                        <div>
                            <div className="text-[10px] font-display font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                                Wealth
                            </div>
                            <div className="text-2xl font-display font-black text-white">{user.stats.wealth || 0}</div>
                        </div>
                        <div className="w-6 h-6 opacity-20 group-hover:opacity-100 transition-opacity text-emerald-400">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22m5-18H8a3 3 0 000 6h9a3 3 0 010 6H7" /></svg>
                        </div>
                      </div>
                  </div>
                  <div className="border border-slate-800 bg-slate-950 p-6 relative group">
                      <div className="absolute -left-1 top-4 bottom-4 w-1 bg-gold"></div>
                      <h3 className="text-sm font-bold text-white uppercase mb-4 tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          Log Achievement
                      </h3>
                      <textarea value={featInput} onChange={e => setFeatInput(e.target.value)} className="w-full h-24 bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none mb-4 focus:border-gold transition-colors placeholder-slate-600 font-mono" placeholder="State your feat, Seeker..." />
                      <button onClick={submitFeat} disabled={calculating} className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-colors">
                        {calculating ? 'Analyzing...' : 'Submit to System'}
                      </button>
                  </div>
              </div>
          )}

          {tab === 'QUESTS' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">Active Quests</h2>
                      <button onClick={handleGenerateQuests} disabled={generatingQuest} className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-3 py-1 rounded-full uppercase font-black hover:bg-gold/20 transition-all disabled:opacity-50">
                        {generatingQuest ? 'Scanning...' : 'Seek New Directives'}
                      </button>
                  </div>
                  <div className="space-y-4">
                      {quests.map(t => {
                          const expiresAt = t.expires_at ? new Date(t.expires_at).getTime() : 0;
                          const timeLeft = Math.max(0, expiresAt - Date.now());
                          const isExpired = timeLeft === 0 && expiresAt > 0;
                          const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                          const minsLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                          const secsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);

                          return (
                              <div key={t.id} className={`glass-card p-6 rounded-xl flex items-center justify-between transition-all relative overflow-hidden group ${t.completed ? 'opacity-40 border-green-500/30' : (isExpired ? 'opacity-40 border-red-500/30' : 'hover:border-gold/50')}`}>
                                  <div className="flex items-center gap-6">
                                      <div className={`w-10 h-10 glass-card rounded-lg flex items-center justify-center border-white/10 ${t.completed ? 'bg-green-500/10 border-green-500/30' : 'group-hover:border-gold/30'}`}>
                                          {t.completed ? <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div> : (isExpired ? <div className="w-3 h-3 bg-red-500 rounded-full"></div> : <div className="w-5 h-5 border-2 border-slate-500 rounded-full flex items-center justify-center group-hover:border-gold/50 transition-colors"><div className="w-2 h-2 border border-slate-500 rounded-full group-hover:border-gold/50"></div></div>)}
                                      </div>
                                      <div>
                                         <div className="flex items-center gap-3 mb-1">
                                             <p className="text-[10px] font-display font-black text-gold uppercase tracking-[0.2em]">{t.difficulty} Tier Directive</p>
                                             {!t.completed && expiresAt > 0 && !isExpired && (
                                                 <p className="text-[8px] text-red-400 font-mono uppercase animate-pulse">Expires in {hoursLeft}h {minsLeft}m {secsLeft}s</p>
                                             )}
                                             {isExpired && !t.completed && (
                                                 <p className="text-[8px] text-red-600 font-mono uppercase">Expired</p>
                                             )}
                                         </div>
                                         <p className="text-sm font-bold text-white tracking-wide leading-tight">{t.text}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      {!t.completed && !isExpired && (
                                          <button 
                                            onClick={() => handleCompleteQuest(t)}
                                            className="p-3 bg-white text-black hover:bg-gold transition-colors rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center"
                                            title="Complete Quest"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                            </svg>
                                          </button>
                                      )}
                                      <div className="text-right">
                                          <p className="text-[10px] font-mono text-slate-400 uppercase">+{t.xp_reward} EXP</p>
                                          <div className="w-16 h-[2px] bg-white/10 mt-1">
                                              <div className={`h-full ${t.completed ? 'bg-green-500' : 'bg-white/40'}`} style={{ width: t.completed ? '100%' : '30%' }}></div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                      {quests.length === 0 && !generatingQuest && <div className="py-12 text-center text-slate-600 text-[10px] uppercase border border-dashed border-slate-800 rounded-xl">No active directives. Seek the void for purpose.</div>}
                  </div>
              </div>
          )}

          {tab === 'GOALS' && (
              <div className="animate-fade-in space-y-6">
                  <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          Sacred Goals
                      </h3>
                      <div className="glass-card p-6 rounded-2xl border-indigo-500/20 bg-indigo-500/5 mb-6">
                          <div className="flex gap-2 mb-4">
                              <input 
                                value={goalInput}
                                onChange={e => setGoalInput(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 p-3 text-white text-[10px] outline-none focus:border-indigo-500 transition-all uppercase tracking-widest"
                                placeholder="Define your trajectory..."
                              />
                              <button onClick={handleAddGoal} className="px-4 bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-colors">Add</button>
                          </div>
                          <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest mb-4 opacity-70">Long-term Trajectory</p>
                          <div className="space-y-4">
                              {((user as any).goals || []).length > 0 ? ((user as any).goals as string[]).map((g, i) => (
                                  <div key={i} className="flex items-center gap-3">
                                      <div className="w-1 h-4 bg-indigo-500/50"></div>
                                      <p className="text-sm text-slate-200 italic">"{g}"</p>
                                  </div>
                              )) : (
                                  <p className="text-slate-500 text-[10px] uppercase italic">No goals defined in soul-architecture.</p>
                              )}
                          </div>
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase tracking-widest text-center px-4">
                        Goals help the AI tailor your quests to your desired evolution path.
                      </p>
                  </div>
              </div>
          )}

          {tab === 'INVENTORY' && (
              <div className="animate-fade-in space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2"><IconLock className="w-3 h-3" /> Mental Artifacts</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {user.inventory && user.inventory.length > 0 ? (
                            user.inventory.map((item, i) => <ArtifactCard key={item.id || i} artifact={item} />)
                        ) : (
                            <div className="col-span-3 flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 text-slate-600 text-[10px] uppercase rounded-lg">
                                <IconMirror className="w-6 h-6 mb-2 text-slate-700" /><span className="mt-1">The void is empty. Enter Mirror to manifest self.</span>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
          )}
      </div>
      
      <div className="px-6 mb-8">
        <button 
          onClick={onLogout}
          className="w-full py-4 border border-red-900/30 text-red-500/70 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-950/20 hover:text-red-400 transition-all rounded-xl"
        >
          Disconnect Signal
        </button>
      </div>

      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
    </div>
  );
};

          {tab === 'INVENTORY' && (
              <div className="animate-fade-in space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2"><IconLock className="w-3 h-3" /> Mental Artifacts</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {user.inventory && user.inventory.length > 0 ? (
                            user.inventory.map((item, i) => <ArtifactCard key={item.id || i} artifact={item} />)
                        ) : (
                            <div className="col-span-3 flex flex-col items-center justify-center py-12 border border-dashed border-slate-800 text-slate-600 text-[10px] uppercase rounded-lg">
                                <IconMirror className="w-6 h-6 mb-2 text-slate-700" /><span className="mt-1">The void is empty. Enter Mirror to manifest self.</span>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
          )}
      </div>
      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
    </div>
  );
};
