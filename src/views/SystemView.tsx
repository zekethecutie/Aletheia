
import React, { useState } from 'react';
import { User, DailyTask, Artifact } from '../types';
import { calculateFeat, generateQuest } from '../services/geminiService';
import { IconSettings, IconPlus, IconEye, IconLock, IconTrash, IconMirror } from '../components/Icons';
import { SettingsModal } from '../components/modals/SettingsModal';
import { getRank, getRankColor } from '../utils/helpers';

// --- Sub-components ---

const StatHex: React.FC<{ label: string; value: number; color: string; description?: string; activeAnalysis: boolean }> = ({ label, value, color, description, activeAnalysis }) => (
  <div className="relative group transition-all duration-300">
     <div className={`flex flex-col items-center justify-center p-2 ${activeAnalysis ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
        <div className="w-14 h-14 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] relative">
            <div className={`absolute inset-0 rounded-full opacity-20 ${color.replace('text-', 'bg-')}`}></div>
            <span className={`text-lg font-black ${color}`}>{value}</span>
        </div>
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-2">{label}</span>
     </div>
     
     {activeAnalysis && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-2xl w-32 text-center animate-fade-in-up z-20 relative">
                <p className={`text-[10px] font-black uppercase ${color} mb-1`}>{label}</p>
                <p className="text-[9px] text-slate-300 leading-tight">{description}</p>
            </div>
        </div>
     )}
  </div>
);

const ArtifactCard: React.FC<{ artifact: Artifact }> = ({ artifact }) => {
    // Safety map to prevent crashes if AI generates a slightly different string
    const rarityColors: Record<string, string> = {
        'COMMON': 'border-slate-800 text-slate-500',
        'RARE': 'border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]',
        'LEGENDARY': 'border-gold/50 text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]',
        'MYTHIC': 'border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
    };

    // Safe lookup with fallback
    const rarityKey = (artifact.rarity || 'COMMON').toUpperCase();
    const colorClass = rarityColors[rarityKey] || rarityColors['COMMON'];
    const textColor = colorClass.split(' ')[1] || 'text-slate-500';

    return (
        <div className={`aspect-square bg-slate-950 border ${colorClass} p-2 flex flex-col items-center justify-center text-center relative group overflow-hidden cursor-pointer hover:bg-slate-900 transition-colors`}>
            {/* Display Image if available, else Icon */}
            {artifact.imageUrl ? (
                <div className="w-full h-full absolute inset-0 opacity-80 group-hover:scale-110 transition-transform duration-500">
                    <img src={artifact.imageUrl} className="w-full h-full object-cover" alt={artifact.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                </div>
            ) : (
                <div className="text-3xl mb-2 filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">{artifact.icon || '📦'}</div>
            )}
            
            <div className="text-[8px] font-black uppercase tracking-wide truncate w-full px-1 z-10 relative mt-auto mb-1 drop-shadow-md">{artifact.name}</div>
            
            {/* Tooltip */}
            <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 backdrop-blur-sm pointer-events-none">
                <p className={`text-[8px] font-bold uppercase mb-2 ${textColor}`}>{artifact.rarity}</p>
                <p className="text-[9px] text-white leading-tight mb-2 font-serif italic line-clamp-3">"{artifact.description}"</p>
                <div className="h-[1px] w-4 bg-slate-700 mb-2"></div>
                <p className="text-[8px] text-green-400 font-mono uppercase">{artifact.effect}</p>
            </div>
        </div>
    );
};

export const SystemView: React.FC<{ user: User; onUpdateUser: (u: User) => void }> = ({ user, onUpdateUser }) => {
  const [tab, setTab] = useState<'STATUS' | 'QUESTS' | 'INVENTORY'>('STATUS');
  const [taskInput, setTaskInput] = useState('');
  const [featInput, setFeatInput] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeQuestType, setActiveQuestType] = useState<'DAILY' | 'HABIT'>('DAILY');
  const [analyzeMode, setAnalyzeMode] = useState(false);
  const [generatingQuest, setGeneratingQuest] = useState(false);

  const rank = getRank(user.stats.level);
  const xpPercent = (user.stats.xp / user.stats.xpToNextLevel) * 100;

  // --- Actions ---

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

  const handleGenerateQuest = async () => {
     setGeneratingQuest(true);
     const newQuest = await generateQuest(user.stats);
     onUpdateUser({ ...user, tasks: [newQuest, ...user.tasks] });
     setGeneratingQuest(false);
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
    const res = await calculateFeat(featInput, user.stats);
    
    // Simple level up logic
    let newXp = user.stats.xp + res.xpGained;
    let newLevel = user.stats.level;
    let nextXp = user.stats.xpToNextLevel;
    if (newXp >= nextXp) { newLevel += 1; newXp -= nextXp; nextXp = Math.floor(nextXp * 1.2); }

    const newStats = { ...user.stats, xp: newXp, level: newLevel, xpToNextLevel: nextXp };
    // Apply stat bumps
    if (res.statsIncreased.wealth) newStats.wealth = (newStats.wealth || 0) + res.statsIncreased.wealth;
    if (res.statsIncreased.strength) newStats.strength = (newStats.strength || 0) + res.statsIncreased.strength;
    if (res.statsIncreased.spirit) newStats.spirit = (newStats.spirit || 0) + res.statsIncreased.spirit;
    if (res.statsIncreased.intellect) newStats.intellect = (newStats.intellect || 0) + res.statsIncreased.intellect;
    if (res.statsIncreased.discipline) newStats.discipline = (newStats.discipline || 0) + res.statsIncreased.discipline;

    onUpdateUser({ ...user, stats: newStats });
    setFeatInput('');
    setCalculating(false);
    alert(`SYSTEM ALERT:\n${res.systemMessage}`);
  };

  return (
    <div className="min-h-screen bg-void pb-24 font-sans text-slate-200">
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>

      {/* HEADER */}
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

      <div className="mt-12 px-6 mb-6">
         <div className="flex justify-between items-end mb-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{user.username}</h1>
            <span className={`text-xl font-black ${getRankColor(rank)}`}>{rank}-RANK</span>
         </div>
         <p className="text-gold text-[10px] uppercase font-bold tracking-[0.3em] mb-4">{user.title || user.stats.class || "Seeker"}</p>
         
         <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
             <div className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-gold" style={{ width: `${xpPercent}%` }}></div>
         </div>
         <div className="flex justify-between mt-1 text-[8px] text-slate-500 font-mono uppercase">
             <span>Progression</span>
             <span>{user.stats.xp} / {user.stats.xpToNextLevel} XP</span>
         </div>
      </div>

      <div className="flex border-b border-slate-900 bg-black/50 backdrop-blur z-10 sticky top-0 mx-4 rounded-t-lg overflow-hidden">
         {['STATUS', 'QUESTS', 'INVENTORY'].map(t => (
             <button 
                key={t}
                onClick={() => setTab(t as any)} 
                className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${tab === t ? 'bg-slate-900 text-white border-b-2 border-gold' : 'bg-slate-950/50 text-slate-600 hover:text-slate-400'}`}
             >
                {t}
             </button>
         ))}
      </div>

      <div className="p-6 pt-6">
          {tab === 'STATUS' && (
              <div className="animate-fade-in space-y-6">
                  <div className="flex justify-end">
                      <button 
                        onClick={() => setAnalyzeMode(!analyzeMode)} 
                        className={`flex items-center gap-2 px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all ${analyzeMode ? 'bg-gold text-black border-gold' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
                      >
                          <IconEye className="w-3 h-3" /> {analyzeMode ? 'Analysis Active' : 'Analyze System'}
                      </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-900/30 p-6 rounded-lg border border-slate-800">
                      <StatHex label="Strength" value={user.stats.strength} color="text-red-500" activeAnalysis={analyzeMode} description="Vitality and raw power." />
                      <StatHex label="Intellect" value={user.stats.intellect} color="text-blue-500" activeAnalysis={analyzeMode} description="Cognitive processing speed." />
                      <StatHex label="Discipline" value={user.stats.discipline || 0} color="text-green-500" activeAnalysis={analyzeMode} description="Willpower and consistency." />
                      <StatHex label="Spirit" value={user.stats.spirit} color="text-purple-500" activeAnalysis={analyzeMode} description="Connection to the void." />
                      <StatHex label="Wealth" value={user.stats.wealth || 0} color="text-yellow-500" activeAnalysis={analyzeMode} description="Material and ethereal resources." />
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
                  <div className="flex gap-4 mb-2">
                     <button onClick={() => setActiveQuestType('DAILY')} className={`text-xs font-bold uppercase tracking-widest ${activeQuestType === 'DAILY' ? 'text-white underline decoration-gold underline-offset-4' : 'text-slate-600'}`}>Daily</button>
                     <button onClick={() => setActiveQuestType('HABIT')} className={`text-xs font-bold uppercase tracking-widest ${activeQuestType === 'HABIT' ? 'text-white underline decoration-gold underline-offset-4' : 'text-slate-600'}`}>Habits</button>
                  </div>

                  <div className="flex gap-2">
                    <input 
                        value={taskInput} 
                        onChange={e => setTaskInput(e.target.value)} 
                        className="flex-1 bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none focus:border-gold transition-colors placeholder-slate-600" 
                        placeholder="Add new directive..." 
                    />
                    <button onClick={() => addTask(activeQuestType)} className="px-5 bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-slate-700">
                        <IconPlus className="w-5 h-5" />
                    </button>
                  </div>

                  {/* AI Quest Gen Button */}
                  {activeQuestType === 'DAILY' && (
                      <button 
                        onClick={handleGenerateQuest} 
                        disabled={generatingQuest}
                        className="w-full py-3 bg-indigo-900/30 border border-indigo-500/50 text-indigo-300 font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2"
                      >
                        {generatingQuest ? 'Consulting The Void...' : 'Generate Quest Protocol'}
                      </button>
                  )}

                  <div className="space-y-3">
                      {user.tasks.filter(t => (t.type || 'DAILY') === activeQuestType).map(t => (
                          <div 
                            key={t.id} 
                            onClick={() => toggleTask(t.id)}
                            className={`p-4 border border-slate-800 flex items-center justify-between cursor-pointer transition-all relative overflow-hidden group ${t.completed && t.type === 'DAILY' ? 'opacity-40 bg-slate-900' : 'bg-slate-950 hover:border-gold/50'}`}
                          >
                              {t.type === 'HABIT' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                              <div className="flex items-center gap-4">
                                  {t.type === 'DAILY' && (
                                    <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-colors ${t.completed ? 'bg-gold border-gold' : 'border-slate-600'}`}>
                                        {t.completed && <div className="w-2 h-2 bg-black"></div>}
                                    </div>
                                  )}
                                  <div>
                                     <span className={`text-sm font-bold ${t.completed && t.type === 'DAILY' ? 'line-through text-slate-500' : 'text-white'}`}>{t.text}</span>
                                     <div className="flex gap-2 mt-1">
                                        {t.difficulty && <span className={`text-[8px] px-1 bg-slate-900 border border-slate-800 text-slate-400 font-mono`}>RANK {t.difficulty}</span>}
                                        {t.type === 'HABIT' && <span className="text-[9px] text-slate-500 uppercase tracking-widest">Streak: {t.streak || 0}</span>}
                                     </div>
                                  </div>
                              </div>
                              <button onClick={(e) => removeTask(t.id, e)} className="text-slate-700 hover:text-red-500 p-2"><IconTrash className="w-4 h-4" /></button>
                          </div>
                      ))}
                      {user.tasks.filter(t => (t.type || 'DAILY') === activeQuestType).length === 0 && (
                          <div className="text-center py-8 text-slate-600 text-xs italic">No active directives.</div>
                      )}
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

      {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
    </div>
  );
};
