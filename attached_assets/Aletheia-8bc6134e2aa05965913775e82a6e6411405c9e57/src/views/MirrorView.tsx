
import React, { useState } from 'react';
import { User, MirrorScenario, MirrorResult, Artifact } from '../types';
import { Header } from '../components/Header';
import { apiClient } from '../services/apiClient';
import { IconEye, IconMirror } from '../components/Icons';

interface MirrorViewProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

export const MirrorView: React.FC<MirrorViewProps> = ({ user, onUpdateUser }) => {
  const [gameMode, setGameMode] = useState<'IDLE' | 'SCENARIO' | 'RESULT'>('IDLE');
  const [scenario, setScenario] = useState<MirrorScenario | null>(null);
  const [gameResult, setGameResult] = useState<MirrorResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const enterMirror = async () => {
        setLoading(true);
        setError(null);
        try {
          const sc = await apiClient.generateMirrorScenario(user.stats);
          if (sc && sc.situation) {
            setScenario(sc);
            setGameMode('SCENARIO');
          } else {
            throw new Error("The Mirror remains dark. Try again later.");
          }
        } catch (error: any) {
          console.error('Failed to generate scenario:', error);
          setError(error.message || "Failed to enter the Mirror.");
        } finally {
          setLoading(false);
        }
    };

  const chooseMirrorOption = async (choice: 'A' | 'B') => {
      if (!scenario) return;
      setLoading(true);
      try {
        const result = await apiClient.evaluateMirrorChoice(scenario.situation, choice === 'A' ? scenario.choiceA : scenario.choiceB);
        
        // If there's a reward, generate an image for it
        if (result.reward && !result.reward.imageUrl) {
          try {
            const imageRes = await apiClient.generateArtifactImage(result.reward.name, result.reward.description);
            result.reward.imageUrl = imageRes.imageUrl;
          } catch (e) {
            console.warn('Image generation failed');
          }
        }

        setGameResult(result);
        setGameMode('RESULT');

        const newStats = { ...user.stats };
        if (result.statChange) {
           Object.entries(result.statChange).forEach(([k, v]) => {
              if (k in newStats) (newStats as any)[k] += v;
           });
        }
        
        const newInventory = user.inventory ? [...user.inventory] : [];
        if (result.rewardType === 'ARTIFACT' && result.reward) {
          const artifact = {
            ...result.reward,
            id: Date.now().toString(),
            dateAcquired: Date.now()
          };
          newInventory.push(artifact);
        }

        // Apply changes to actual profile
        await apiClient.updateProfile(user.id, { 
          stats: newStats, 
          inventory: newInventory 
        });

        onUpdateUser({ ...user, stats: newStats, inventory: newInventory });
      } catch (error) {
        console.error('Failed to evaluate choice:', error);
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-void pb-24 font-sans text-slate-200 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-b from-indigo-950/20 to-black pointer-events-none"></div>
        <Header title="The Mirror" subtitle="Reflect & Ascend" />

        <div className="p-6 relative z-10 flex flex-col items-center justify-center min-h-[70vh]">
            {loading && (
                <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full"></div>
                        <p className="text-indigo-400 text-xs font-black uppercase tracking-widest animate-pulse">Consulting Fate...</p>
                    </div>
                </div>
            )}

            {gameMode === 'IDLE' && (
                <div className="text-center max-w-sm space-y-12 animate-blur-in">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gold/20 blur-[100px] rounded-full animate-pulse"></div>
                        <div className="w-48 h-48 mx-auto rounded-2xl glass-card p-1 shadow-[0_0_80px_rgba(212,175,55,0.2)] rotate-45 group hover:rotate-[225deg] transition-all duration-1000 relative z-10 overflow-visible">
                            <div className="w-full h-full bg-black rounded-xl flex items-center justify-center -rotate-45 group-hover:rotate-[-225deg] transition-all duration-1000">
                                <IconEye className="w-20 h-20 text-gold/80 drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 font-sans">The Reflection</h2>
                        <p className="text-slate-400 text-[11px] font-serif leading-relaxed tracking-wide uppercase opacity-70">"Face the truth of your own architecture."</p>
                    </div>
                    <button onClick={enterMirror} className="group w-full py-6 glass-card text-gold font-black uppercase text-[10px] tracking-[0.4em] hover:bg-gold/10 transition-all border-gold/20 relative overflow-hidden">
                        <span className="relative z-10">Ascend Threshold</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </button>
                </div>
            )}

            {gameMode === 'SCENARIO' && scenario && (
                <div className="w-full max-w-md animate-fade-in">
                    <div className="bg-slate-950/80 border border-indigo-900/50 p-8 rounded-lg shadow-2xl relative overflow-hidden">
                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">Stat Test: {scenario.testedStat}</p>
                        <h3 className="text-xl md:text-2xl text-white font-serif italic leading-relaxed mb-8">"{scenario.situation}"</h3>
                        <div className="space-y-4">
                            <button onClick={() => chooseMirrorOption('A')} className="w-full p-6 border border-slate-800 bg-slate-900/50 hover:bg-indigo-900/20 hover:border-indigo-500/50 text-left transition-all rounded-sm">
                                <span className="text-slate-300 text-sm">{scenario.choiceA}</span>
                            </button>
                            <button onClick={() => chooseMirrorOption('B')} className="w-full p-6 border border-slate-800 bg-slate-900/50 hover:bg-indigo-900/20 hover:border-indigo-500/50 text-left transition-all rounded-sm">
                                <span className="text-slate-300 text-sm">{scenario.choiceB}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {gameMode === 'RESULT' && gameResult && (
                <div className="w-full max-w-md animate-fade-in text-center">
                    <p className="text-white font-serif text-lg leading-relaxed border-l-2 border-indigo-500 pl-6 text-left italic bg-indigo-900/10 py-4 mb-8">{gameResult.outcome}</p>
                    
                    {gameResult.rewardType === 'STAT_ONLY' ? (
                        <div className="mb-8 animate-slide-up">
                            <p className="text-xs text-purple-400 uppercase font-bold tracking-widest mb-4">Stat Gain Manifested</p>
                            <div className="w-64 mx-auto bg-purple-950/20 border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.5)] p-6 rounded-lg">
                                <p className="text-white font-serif italic mb-4">Your essence evolved through experience</p>
                                {gameResult.statChange && Object.entries(gameResult.statChange).map(([stat, value]) => (
                                    <div key={stat} className="text-purple-300 text-xs uppercase tracking-widest mb-2">
                                        +{value} {stat.charAt(0).toUpperCase() + stat.slice(1)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : gameResult.reward && (
                        <div className="mb-8 animate-slide-up">
                            <p className="text-xs text-indigo-400 uppercase font-bold tracking-widest mb-4">Artifact Materialized</p>
                            <div className="w-64 h-64 mx-auto bg-black border-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)] relative overflow-hidden">
                                {gameResult.reward.imageUrl ? (
                                    <img src={gameResult.reward.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl">{gameResult.reward.icon}</div>
                                )}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3">
                                    <p className="text-xs font-black uppercase text-indigo-400">{gameResult.reward.name}</p>
                                    <p className="text-[9px] text-slate-400">{gameResult.reward.rarity}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button onClick={() => setGameMode('IDLE')} className="px-8 py-3 border border-slate-700 text-slate-300 uppercase font-bold text-xs hover:border-white transition-colors">Return</button>
                </div>
            )}
        </div>
    </div>
  );
};
