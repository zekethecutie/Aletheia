
import React, { useState, useEffect, useRef } from 'react';
import { User, Artifact } from '../types';
import { apiClient } from '../services/apiClient';
import { IconSettings, IconLock, IconMirror } from '../components/Icons';
import { SettingsModal } from '../components/modals/SettingsModal';
import { StatsRadar } from '../components/StatsRadar';

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
  const [tab, setTab] = useState<'STATUS' | 'QUESTS' | 'SACRED_PATH' | 'INVENTORY'>('QUESTS');
  const [featInput, setFeatInput] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [habitInput, setHabitInput] = useState('');
  const [habitAction, setHabitAction] = useState<Record<number, string>>({});
  const [habits, setHabits] = useState<any[]>([]);
  const [trackingHabit, setTrackingHabit] = useState<number | null>(null);
  const [quests, setQuests] = useState<any[]>([]);
  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [questDifficulty, setQuestDifficulty] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('C');
  const [questXP, setQuestXP] = useState(100);
  const [generatingQuest, setGeneratingQuest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (tab === 'QUESTS') {
        const data = await apiClient.getQuests(user.id);
        setQuests(data);
      } else if (tab === 'SACRED_PATH') {
        const data = await apiClient.getHabits(user.id);
        setHabits(data);
      }
    };
    fetchData();
  }, [tab, user.id]);

  const handleAddGoal = async () => {
    if (!goalInput.trim()) return;
    const newGoals = [...(user.goals || []), goalInput];
    try {
      await apiClient.updateProfile(user.id, { goals: newGoals });
      onUpdateUser({ ...user, goals: newGoals });
      setGoalInput('');
    } catch (e) { console.error(e); }
  };

  const handleAddHabit = async () => {
    if (!habitInput.trim()) return;
    try {
      const newHabit = await apiClient.createHabit(user.id, habitInput);
      setHabits([newHabit, ...habits]);
      setHabitInput('');
    } catch (e) { console.error(e); }
  };

  const handleTrackHabit = async (habitId: number) => {
    const action = habitAction[habitId];
    if (!action?.trim()) return;
    setTrackingHabit(habitId);
    try {
      const res = await apiClient.trackHabit(user.id, habitId, action);
      alert(`SENTINEL VERDICT: ${res.feedback}\nXP Gained: ${res.xp}`);
      
      if (res.success) {
        let newXp = user.stats.xp + res.xp;
        let newLevel = user.stats.level;
        let nextXp = user.stats.xpToNextLevel;
        if (newXp >= nextXp) { newLevel += 1; newXp -= nextXp; nextXp = Math.floor(nextXp * 1.2); }
        
        const newStats = { ...user.stats, xp: newXp, level: newLevel, xpToNextLevel: nextXp };
        if (res.stat_reward) {
          Object.keys(res.stat_reward).forEach(k => {
            const key = k as keyof typeof newStats;
            if (typeof newStats[key] === 'number') {
                (newStats[key] as any) += res.stat_reward[k];
            }
          });
        }
        onUpdateUser({ ...user, stats: newStats });
      }
      
      const updatedHabits = await apiClient.getHabits(user.id);
      setHabits(updatedHabits);
      setHabitAction(prev => ({ ...prev, [habitId]: '' }));
    } catch (e) { console.error(e); }
    finally { setTrackingHabit(null); }
  };

  const handleCreateQuest = async () => {
    if (!questTitle.trim()) {
      alert("Quest must have a directive.");
      return;
    }
    try {
      const response = await fetch('/api/quests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          text: questTitle,
          description: questDesc,
          difficulty: questDifficulty,
          xp_reward: questXP
        })
      });
      if (!response.ok) throw new Error('Failed to create quest');
      const data = await apiClient.getQuests(user.id);
      setQuests(data);
      setQuestTitle('');
      setQuestDesc('');
      setQuestDifficulty('C');
      setQuestXP(100);
    } catch (error) {
      console.error('Failed to create quest:', error);
      alert("Failed to manifest directive. Try again.");
    }
  };

  const handleGenerateQuests = async () => {
    if (generatingQuest) return;
    setGeneratingQuest(true);
    try {
      await apiClient.generateQuests(user.id, user.stats, user.goals);
      const data = await apiClient.getQuests(user.id);
      setQuests(data);
    } catch (error) {
      console.error('Failed to generate quests:', error);
      alert("The Spire failed to manifest new directives. Try again later.");
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

  return (
    <div className="min-h-screen bg-void pb-24 font-sans text-slate-200">
      <div className="relative w-full h-56 bg-slate-950 group">
          <div className="absolute inset-0 z-0 overflow-hidden">
             {user.coverUrl ? (
                 <img src={user.coverUrl} className="w-full h-full object-cover opacity-80 transition-transform duration-1000 group-hover:scale-105" />
             ) : (
                 <div className="w-full h-full bg-slate-950 relative">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                 </div>
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

      <div className="flex gap-1 px-4 mb-8">
         {['QUESTS', 'SACRED_PATH', 'ACHIEVEMENTS', 'STATS'].map(t => {
             const tabValue = t === 'STATS' ? 'STATUS' : (t === 'QUESTS' ? 'QUESTS' : (t === 'SACRED_PATH' ? 'SACRED_PATH' : 'INVENTORY'));
             return (
               <button key={t} onClick={() => setTab(tabValue as any)} className={`flex-1 py-2 px-1 rounded-lg text-[9px] font-display font-black uppercase tracking-[0.1em] transition-all border ${tab === tabValue ? 'bg-slate-800 text-white border-white/20' : 'bg-transparent text-slate-600 border-transparent hover:text-slate-400'}`}>
                  {t.replace('_', ' ')}
               </button>
             );
         })}
      </div>

      <div className="p-6 pt-6">
          {tab === 'SACRED_PATH' && (
              <div className="animate-fade-in space-y-8">
                  <section>
                      <h2 className="text-xl font-display font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          Sacred Goals
                      </h2>
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
                          <div className="space-y-4">
                              {(user.goals || []).length > 0 ? (user.goals as string[]).map((g: string, i: number) => (
                                  <div key={i} className="flex items-center gap-3 group">
                                      <div className="w-1 h-4 bg-indigo-500/50"></div>
                                      <p className="text-sm text-slate-200 italic flex-1">{g}</p>
                                  </div>
                              )) : <p className="text-center text-slate-600 text-[9px] uppercase">No trajectory defined.</p>}
                          </div>
                      </div>
                  </section>

                  <section>
                      <h2 className="text-xl font-display font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                          <span className="w-2 h-2 bg-gold rounded-full"></span>
                          Sacred Habits
                      </h2>
                      <div className="glass-card p-6 rounded-2xl border-white/5 bg-slate-900/20">
                          <div className="flex gap-2 mb-4">
                              <input 
                                value={habitInput}
                                onChange={e => setHabitInput(e.target.value)}
                                className="flex-1 bg-black/40 border border-white/10 p-3 text-white text-[10px] outline-none focus:border-gold transition-all uppercase tracking-widest"
                                placeholder="Forge a new habit..."
                              />
                              <button onClick={handleAddHabit} className="px-4 bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors">Forge</button>
                          </div>
                          <div className="space-y-4">
                              {habits.map(h => (
                                  <div key={h.id} className="glass-card p-4 rounded-xl border-white/5 space-y-3">
                                      <div className="flex justify-between items-center">
                                          <div>
                                              <p className="text-sm font-bold text-white uppercase tracking-wide">{h.name}</p>
                                              <p className="text-[9px] text-gold font-black uppercase tracking-widest">Streak: {h.streak} Cycles</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-2">
                                          <input 
                                            value={habitAction[h.id] || ''}
                                            onChange={e => setHabitAction(prev => ({ ...prev, [h.id]: e.target.value }))}
                                            className="flex-1 bg-black border border-white/5 p-2 text-white text-[10px] outline-none focus:border-gold/30"
                                            placeholder="What did you do today?"
                                          />
                                          <button 
                                            onClick={() => handleTrackHabit(h.id)}
                                            disabled={trackingHabit === h.id}
                                            className="px-4 py-2 bg-slate-800 text-white text-[9px] font-black uppercase tracking-widest hover:bg-slate-700 disabled:opacity-50"
                                          >
                                            Log
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {habits.length === 0 && <p className="text-center text-slate-600 text-[9px] uppercase">No habits forged.</p>}
                          </div>
                      </div>
                  </section>
              </div>
          )}

          {tab === 'STATUS' && (
              <div className="animate-fade-in space-y-6">
                  <StatsRadar stats={user.stats} />
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
                  <div className="mb-6 flex gap-4">
                      <button 
                        onClick={handleGenerateQuests} 
                        disabled={generatingQuest} 
                        className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-4 py-2 rounded-full uppercase font-black hover:bg-gold/20 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {generatingQuest ? <div className="w-2 h-2 border-2 border-gold border-t-transparent animate-spin rounded-full"></div> : null}
                        {generatingQuest ? 'Manifesting...' : 'Seek New Directives'}
                      </button>
                      <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest">OR Forge Manually</h2>
                  </div>
                  <div className="glass-card p-6 rounded-2xl border-white/5 space-y-3 mb-6">
                      <input 
                        value={questTitle}
                        onChange={e => setQuestTitle(e.target.value)}
                        placeholder="Quest objective..."
                        className="w-full bg-slate-900 border border-white/10 p-3 text-white text-sm outline-none focus:border-gold transition-all uppercase tracking-wider font-bold"
                      />
                      <textarea
                        value={questDesc}
                        onChange={e => setQuestDesc(e.target.value)}
                        placeholder="Description (optional)..."
                        className="w-full bg-slate-900 border border-white/10 p-3 text-white text-sm outline-none focus:border-gold transition-all h-20"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={questDifficulty}
                          onChange={e => setQuestDifficulty(e.target.value as any)}
                          className="bg-slate-900 border border-white/10 p-2 text-white text-sm outline-none focus:border-gold transition-all uppercase font-bold"
                        >
                          {['E', 'D', 'C', 'B', 'A', 'S'].map(d => <option key={d} value={d}>{d} Tier</option>)}
                        </select>
                        <input
                          type="number"
                          value={questXP}
                          onChange={e => setQuestXP(Math.max(10, parseInt(e.target.value) || 100))}
                          placeholder="XP Reward"
                          className="bg-slate-900 border border-white/10 p-2 text-white text-sm outline-none focus:border-gold transition-all"
                        />
                        <button
                          onClick={handleCreateQuest}
                          className="bg-gold text-black font-black uppercase text-xs tracking-widest hover:bg-gold/80 transition-colors"
                        >
                          Create
                        </button>
                      </div>
                  </div>

                  <div>
                      <h2 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-4">Active Quests</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {quests.length > 0 ? quests.map(t => {
                              const expiresAt = t.expires_at ? new Date(t.expires_at).getTime() : 0;
                              const timeLeft = Math.max(0, expiresAt - Date.now());
                              const isExpired = timeLeft === 0 && expiresAt > 0;
                              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));

                              return (
                                  <div key={t.id} className={`glass-card p-6 rounded-2xl flex flex-col justify-between transition-all relative overflow-hidden group border-white/5 bg-slate-900/30 ${t.completed ? 'opacity-50 border-green-500/30 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' : (isExpired ? 'opacity-40 border-red-500/30' : 'hover:border-gold/40 hover:bg-slate-900/50 hover:shadow-[0_10px_40px_rgba(255,149,0,0.1)]')}`}>
                                      <div className="relative z-10">
                                          <div className="flex items-center justify-between mb-4">
                                              <div className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest ${t.difficulty === 'S' ? 'bg-purple-600 text-white' : (t.difficulty === 'A' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400')}`}>
                                                  {t.difficulty} Tier Directive
                                              </div>
                                              {!t.completed && expiresAt > 0 && !isExpired && (
                                                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-red-500/20">
                                                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                                      <p className="text-[8px] text-red-400 font-mono uppercase font-bold">{hoursLeft}h Left</p>
                                                  </div>
                                              )}
                                          </div>
                                          
                                          <div className="mb-4">
                                            <h3 className="text-sm font-bold text-white tracking-wide leading-snug mb-3 group-hover:text-gold transition-colors">{t.text}</h3>
                                            <p className="text-[10px] text-slate-400 font-mono italic leading-relaxed">RULES: Complete the directive as stated. Truthful completion only.</p>
                                          </div>
                                          
                                          <div className="flex items-center gap-4 mb-6">
                                              <div className="bg-gold/10 border border-gold/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                                  <span className="text-[9px] text-gold/60 uppercase font-black tracking-tighter">Reward</span>
                                                  <span className="text-xs text-gold font-black">+{t.xp_reward} XP</span>
                                              </div>
                                              {t.stat_reward && Object.keys(t.stat_reward).some(k => (t.stat_reward as any)[k] > 0) && (
                                                  <div className="flex gap-1.5">
                                                      {Object.entries(t.stat_reward).map(([stat, val]) => (val as number) > 0 ? (
                                                          <div key={stat} className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center" title={`${stat}: +${val}`}>
                                                              <div className="w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                                          </div>
                                                      ) : null)}
                                                  </div>
                                              )}
                                          </div>
                                      </div>

                                      <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-5 mt-2">
                                          {t.completed ? (
                                              <div className="w-full text-center py-2 text-[10px] text-green-500 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 bg-green-500/5 rounded-lg border border-green-500/10">
                                                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
                                                  Manifested
                                              </div>
                                          ) : isExpired ? (
                                              <div className="w-full text-center py-2 text-[10px] text-red-600 font-black uppercase tracking-[0.2em] bg-red-500/5 rounded-lg border border-red-500/10">Signal Lost</div>
                                          ) : (
                                              <button 
                                                onClick={() => handleCompleteQuest(t)}
                                                className="w-full py-3 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gold hover:tracking-[0.3em] transition-all active:scale-[0.98] shadow-2xl rounded-lg"
                                              >
                                                Manifest Will
                                              </button>
                                          )}
                                      </div>
                                      
                                      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-gold/5 rounded-full blur-3xl group-hover:bg-gold/10 transition-all duration-700"></div>
                                  </div>
                              );
                          }) : (
                            <div className="col-span-full py-20 text-center text-slate-600 text-[11px] font-black uppercase tracking-[0.4em] border-2 border-dashed border-slate-800/50 rounded-3xl bg-black/40 backdrop-blur-sm">
                              The void is silent.<br/>Forge new directives to begin.
                            </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {tab === 'INVENTORY' && (
              <div className="animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-display font-black text-white uppercase tracking-widest">Artifact Repository</h2>
                      <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                          Storage: {(user.inventory || []).length} / 24
                      </div>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {(user.inventory || []).map((art, i) => (
                          <ArtifactCard key={i} artifact={art} />
                      ))}
                      {Array.from({ length: Math.max(0, 24 - (user.inventory || []).length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="aspect-square bg-slate-950/50 border border-slate-900/50 rounded-sm flex items-center justify-center">
                              <IconLock className="w-3 h-3 text-slate-800 opacity-20" />
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>

      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
    </div>
  );
};
