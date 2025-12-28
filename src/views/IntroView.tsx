import React, { useEffect, useState } from 'react';

export const IntroView: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const sequence = [
      { t: 4000, p: 0 }, 
      { t: 4000, p: 1 },
      { t: 4000, p: 2 },
      { t: 100, p: 3 },
    ];
    
    let timer: NodeJS.Timeout;
    const runSequence = (idx: number) => {
      if (idx >= sequence.length) return;
      setPhase(sequence[idx].p);
      timer = setTimeout(() => runSequence(idx + 1), sequence[idx].t);
    };

    runSequence(0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="h-screen w-full bg-void flex flex-col items-center justify-center p-8 text-center cursor-pointer relative overflow-hidden" 
      onClick={onFinish}
    >
      {phase === 0 && (
        <h1 className="text-2xl md:text-4xl font-serif text-slate-300 animate-blur-in leading-relaxed">
          The world is <span className="text-white font-bold">deafening</span>.
        </h1>
      )}
      
      {phase === 1 && (
        <h1 className="text-2xl md:text-4xl font-serif text-slate-300 animate-blur-in leading-relaxed">
          You are drowning in the <span className="text-white font-bold">shallows</span>.
        </h1>
      )}

      {phase === 2 && (
        <h1 className="text-2xl md:text-4xl font-serif text-gold animate-blur-in leading-relaxed tracking-widest">
          It is time to <span className="italic">ascend</span>.
        </h1>
      )}

      {phase >= 3 && (
        <div className="animate-fade-in-up z-10 flex flex-col items-center">
           <div className="w-1 h-20 bg-gradient-to-b from-transparent via-gold to-transparent mb-8"></div>
           <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
             Aletheia
           </h1>
           <p className="text-gold text-xs uppercase tracking-[0.8em] font-bold animate-pulse">
             Tap to Enter
           </p>
        </div>
      )}
    </div>
  );
};
