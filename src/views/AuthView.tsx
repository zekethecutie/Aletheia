
import React, { useState, useEffect } from 'react';
import { User, UserStats } from '../types';
import { submitApplication, generateMysteriousName } from '../services/geminiService';
import { saveUser } from '../utils/helpers';
import { IconLock, IconEye, IconDumbbell, IconSpirit, IconUser, IconCoin } from '../components/Icons';
import { supabase } from '../services/supabaseClient';

// --- Shared Logic ---

/**
 * HEX-ENCODED Deterministic ID Generation
 * Converts username to hex string to guarantee valid email format (a-z0-9 only).
 * Example: "Zeus" -> "u_7a657573@aletheia.app"
 */
const stringToHex = (str: string) => {
  let hex = '';
  for(let i=0;i<str.length;i++) {
    hex += ''+str.charCodeAt(i).toString(16);
  }
  return hex;
}

const generateBackendID = (username: string) => {
  const clean = (username || '').trim().toLowerCase();
  if (!clean) return `u_initiate_${Date.now()}@aletheia.app`;
  
  const hex = stringToHex(clean);
  // Ensure we don't exceed generic length limits (unlikely, but safe)
  const safeHex = hex.substring(0, 50); 
  
  return `u_${safeHex}@aletheia.app`; 
};

// --- Components ---

export const AuthChoiceView: React.FC<{ onChoice: (c: 'CREATE' | 'EMBARK') => void }> = ({ onChoice }) => (
  <div className="h-screen w-full bg-void flex flex-col items-center justify-center p-8 animate-fade-in relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-black to-black opacity-60"></div>
    <div className="z-10 w-full max-w-sm flex flex-col items-center space-y-12">
      <div className="text-center">
         <h1 className="text-6xl font-black text-white tracking-tighter uppercase mb-4 drop-shadow-lg">Aletheia</h1>
         <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold">The Hidden Wisdom</p>
      </div>

      <div className="w-full space-y-4">
        <button 
          onClick={() => onChoice('CREATE')} 
          className="group w-full py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 transition-all transform hover:scale-[1.02]"
        >
          Initiate Protocol
        </button>
        
        <button 
          onClick={() => onChoice('EMBARK')} 
          className="w-full py-4 border border-slate-800 text-slate-400 font-bold uppercase text-xs tracking-[0.2em] hover:text-white hover:border-slate-600 transition-colors"
        >
          Resume Path
        </button>
      </div>
    </div>
  </div>
);

// --- ACCEPTANCE CARD COMPONENT ---
const AcceptanceCard: React.FC<{ user: User, onEnter: () => void }> = ({ user, onEnter }) => (
    <div className="animate-fade-in-up w-full max-w-2xl">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-gold/40 p-10 shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent"></div>
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-gold/5 rounded-full blur-2xl"></div>
            
            <div className="text-center mb-10 relative z-10">
                <div className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-4">
                    <p className="text-gold text-xs font-bold uppercase tracking-widest">IDENTITY PROTOCOL COMPLETE</p>
                </div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">Identity Accepted</h2>
                <p className="text-gold text-sm font-bold uppercase tracking-widest">Welcome, {user.username.toUpperCase()}</p>
            </div>

            <div className="space-y-6 mb-10 relative z-10">
                <div className="bg-gradient-to-r from-gold/5 to-transparent p-6 border-l-4 border-gold rounded-r-lg">
                    <p className="text-gold text-[10px] uppercase font-black tracking-widest mb-3">COUNCIL VERDICT</p>
                    <p className="text-white text-lg font-serif italic leading-relaxed">"{user.originStory}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 p-4 border border-gold/30 rounded-lg text-center">
                        <p className="text-gold text-[10px] uppercase font-bold tracking-widest mb-2">Class Archetype</p>
                        <p className="text-2xl font-black text-white uppercase">{user.stats.class}</p>
                    </div>
                    <div className="bg-slate-900/60 p-4 border border-gold/30 rounded-lg text-center">
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-2">Starting Level</p>
                        <p className="text-2xl font-black text-white">LVL {user.stats.level}</p>
                    </div>
                </div>

                <div className="bg-slate-900/40 p-6 border border-slate-800 rounded-lg">
                    <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-4">INITIAL ATTRIBUTES</p>
                    <div className="grid grid-cols-5 gap-3">
                         <div className="text-center">
                            <IconUser className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Intellect</p>
                            <span className="text-white font-black text-lg">{user.stats.intellect}</span>
                         </div>
                         <div className="text-center">
                            <IconDumbbell className="w-5 h-5 mx-auto mb-2 text-red-400" />
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Strength</p>
                            <span className="text-white font-black text-lg">{user.stats.strength}</span>
                         </div>
                         <div className="text-center">
                            <IconSpirit className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Spirit</p>
                            <span className="text-white font-black text-lg">{user.stats.spirit}</span>
                         </div>
                         <div className="text-center">
                            <IconLock className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Discipline</p>
                            <span className="text-white font-black text-lg">{user.stats.discipline}</span>
                         </div>
                         <div className="text-center">
                            <IconCoin className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Wealth</p>
                            <span className="text-white font-black text-lg">{user.stats.wealth}</span>
                         </div>
                    </div>
                </div>
            </div>

            <button 
                onClick={onEnter} 
                className="w-full py-6 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] relative z-10"
            >
                Enter The Sanctum
            </button>
        </div>
    </div>
);

export const CreateIdentityView: React.FC<{ onComplete: (u: User) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [manifesto, setManifesto] = useState('');
  
  // Logic States
  const [phase, setPhase] = useState<'FORM' | 'PROCESSING' | 'ACCEPTED'>('FORM');
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [availability, setAvailability] = useState<'IDLE' | 'CHECKING' | 'AVAILABLE' | 'TAKEN'>('IDLE');
  const [createdUser, setCreatedUser] = useState<User | null>(null);

  // --- 1. Username Availability Checker ---
  useEffect(() => {
    const checkAvailability = async () => {
      const clean = username.trim();
      if (clean.length < 3) {
        setAvailability('IDLE');
        return;
      }

      setAvailability('CHECKING');
      try {
        const { count, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('username', clean); // Strict equality check
        
        if (!error && count !== null && count > 0) {
          setAvailability('TAKEN');
        } else {
          setAvailability('AVAILABLE');
        }
      } catch (e) {
        setAvailability('AVAILABLE');
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [username]);


  const handleRegister = async () => {
    setError('');
    setStatusMsg('');
    
    // Validation
    if (availability === 'TAKEN') return setError("Designation is already claimed.");
    if (username.length < 3) return setError("Designation too short.");
    if (password.length < 6) return setError("Key must be 6+ chars.");
    const wordCount = manifesto.trim().split(/\s+/).length;
    if (wordCount < 3) return setError("Manifesto is silence. Speak.");

    setPhase('PROCESSING');

    try {
      const cleanUsername = username.trim();
      // Generate SAFE ID
      const backendEmail = generateBackendID(cleanUsername);

      // --- Step 1: AI Analysis ---
      setStatusMsg("The Council is judging your intent...");
      
      let stats = { level: 1, xp: 0, xpToNextLevel: 100, intellect: 1, discipline: 1, spirit: 1, strength: 1, wealth: 1, class: "Initiate" };
      let originStory = "Accepted into the void.";
      
      try {
         const analysis = await submitApplication(manifesto);
         if (analysis) {
             if (analysis.initialStats) stats = analysis.initialStats;
             if (analysis.reason) originStory = analysis.reason;
         }
      } catch (aiError) {
         console.warn("AI skipped.");
      }

      // --- Step 2: Backend Creation ---
      setStatusMsg("Forging identity...");

      const { data, error: authError } = await supabase.auth.signUp({
        email: backendEmail,
        password: password,
        options: {
          data: { username: cleanUsername }
        }
      });

      if (authError) {
          const msg = authError.message.toLowerCase();
          if (msg.includes('already registered') || msg.includes('unique constraint')) {
              throw new Error("This designation is already claimed.");
          }
          // Generic fallback
          throw authError;
      }

      if (!data.user) throw new Error("The Void rejected the signal.");

      // --- Step 3: Profile Creation ---
      // Fix missing following property
      const newUser: User = {
        id: data.user.id,
        username: cleanUsername,
        isVerified: true,
        joinDate: new Date().toISOString(),
        lastLogin: Date.now(),
        stats,
        tasks: [],
        inventory: [],
        manifesto,
        originStory,
        entropy: 0,
        following: []
      };

      const { error: profileError } = await supabase.from('profiles').insert({
        id: newUser.id,
        username: newUser.username,
        manifesto: newUser.manifesto,
        origin_story: newUser.originStory,
        stats: newUser.stats,
        inventory: newUser.inventory,
        updated_at: newUser.joinDate
      });
      
      if (profileError) {
          // If profile fails (rare), we might want to clean up auth, but for now just log
          console.error("Profile creation warning:", profileError);
      }

      // --- SUCCESS ---
      saveUser(newUser);
      setCreatedUser(newUser);
      setPhase('ACCEPTED'); // Move to acceptance screen

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Protocol Failed.");
      setPhase('FORM');
    }
  };

  if (phase === 'ACCEPTED' && createdUser) {
      return (
          <div className="min-h-screen bg-void flex flex-col items-center justify-center p-6">
              <AcceptanceCard user={createdUser} onEnter={() => onComplete(createdUser)} />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-void flex flex-col animate-fade-in relative overflow-y-auto">
      <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-black to-black opacity-80"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>
      
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-500 uppercase text-[10px] font-bold tracking-widest hover:text-white z-20">Back</button>
      
      <div className="flex-1 flex flex-col justify-center px-8 py-20 max-w-md mx-auto w-full space-y-8 relative z-10">
         <div className="space-y-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Identify</h2>
            <p className="text-slate-500 text-xs font-serif italic">Who are you in the dark?</p>
         </div>

         <div className="space-y-6">
            {/* Username */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                 <label className="text-[10px] text-gold uppercase font-bold tracking-widest block">Designation</label>
                 {availability === 'CHECKING' && <span className="text-[9px] text-slate-500 uppercase animate-pulse">Scanning Void...</span>}
                 {availability === 'AVAILABLE' && <span className="text-[9px] text-green-500 uppercase font-bold tracking-widest">Available</span>}
                 {availability === 'TAKEN' && <span className="text-[9px] text-red-500 uppercase font-bold tracking-widest">Taken</span>}
              </div>
              <div className="flex gap-2">
                <input 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className={`flex-1 bg-slate-900/50 border p-4 text-white text-sm outline-none transition-colors placeholder-slate-700 ${availability === 'TAKEN' ? 'border-red-900/50 focus:border-red-500' : 'border-slate-800 focus:border-gold'}`}
                  placeholder="Your Name" 
                />
                <button 
                  onClick={async () => {
                     const name = await generateMysteriousName();
                     setUsername(name);
                  }}
                  className="px-4 bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-bold uppercase hover:bg-slate-700 hover:text-white transition-colors"
                >
                  Gen
                </button>
              </div>
              <p className="text-[9px] text-slate-600 mt-1 uppercase tracking-wider">Letters and numbers only.</p>
            </div>

            {/* Password */}
            <div>
               <label className="text-[10px] text-gold uppercase font-bold tracking-widest mb-1 block">Secure Key</label>
               <div className="relative">
                 <input 
                    type={showPwd ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-800 p-4 text-white text-sm outline-none focus:border-gold transition-colors placeholder-slate-700" 
                    placeholder="••••••" 
                 />
                 <button 
                   onClick={() => setShowPwd(!showPwd)} 
                   className="absolute right-0 top-0 bottom-0 px-4 text-slate-500 hover:text-white transition-colors flex items-center justify-center"
                   type="button"
                   tabIndex={-1}
                 >
                    {showPwd ? <IconLock className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                 </button>
               </div>
            </div>

            {/* Manifesto */}
            <div>
               <label className="text-[10px] text-gold uppercase font-bold tracking-widest mb-1 block">Manifesto</label>
               <textarea 
                  value={manifesto} 
                  onChange={e => setManifesto(e.target.value)}
                  className="w-full h-24 bg-slate-900/50 border border-slate-800 p-4 text-white text-sm outline-none focus:border-gold transition-colors placeholder-slate-700 resize-none font-serif" 
                  placeholder="I seek the truth behind the noise..." 
               />
            </div>
         </div>

         {error && (
            <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-500 text-xs font-bold uppercase text-center animate-pulse">
                {error}
            </div>
         )}
         
         {statusMsg && (
            <div className="text-center text-gold text-xs font-bold uppercase tracking-widest animate-pulse">
                {statusMsg}
            </div>
         )}

         <button 
            onClick={handleRegister} 
            disabled={phase === 'PROCESSING' || availability === 'TAKEN'}
            className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
         >
            {phase === 'PROCESSING' ? 'Processing...' : 'Submit to Council'}
         </button>
      </div>
    </div>
  );
};

export const EmbarkView: React.FC<{ onComplete: (u: User) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const cleanUsername = username.trim();
      const backendEmail = generateBackendID(cleanUsername);

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: backendEmail,
        password
      });

      if (authError) throw new Error("Identity or Key incorrect.");

      if (data.user) {
        // Fetch Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        
        // Fix missing following property
        const user: User = {
          id: data.user.id,
          username: profile?.username || cleanUsername,
          isVerified: true,
          joinDate: new Date().toISOString(),
          lastLogin: Date.now(),
          stats: profile?.stats || { level: 1, xp: 0, xpToNextLevel: 100, intellect: 1, discipline: 1, spirit: 1, strength: 1, wealth: 1, class: "Unknown" },
          tasks: profile?.tasks || [],
          inventory: profile?.inventory || [],
          manifesto: profile?.manifesto,
          originStory: profile?.origin_story,
          avatarUrl: profile?.avatar_url,
          coverUrl: profile?.cover_url,
          entropy: profile?.entropy || 0,
          following: profile?.following || []
        };

        saveUser(user);
        onComplete(user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-void flex flex-col items-center justify-center p-8 animate-fade-in relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-500 uppercase text-[10px] font-bold tracking-widest hover:text-white z-20">Back</button>

      <div className="w-full max-sm space-y-8">
         <div className="text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Access Terminal</h2>
            <div className="h-[1px] w-12 bg-gold mx-auto opacity-50"></div>
         </div>

         <div className="space-y-4">
            <input 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              className="w-full bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none focus:border-white transition-colors placeholder-slate-600" 
              placeholder="Designation" 
            />
            
            <div className="relative">
              <input 
                type={showPwd ? "text" : "password"} 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none focus:border-white transition-colors placeholder-slate-600" 
                placeholder="Secure Key" 
              />
              <button 
                onClick={() => setShowPwd(!showPwd)} 
                className="absolute right-0 top-0 bottom-0 px-4 text-slate-500 hover:text-white transition-colors flex items-center justify-center"
                type="button"
                tabIndex={-1}
              >
                {showPwd ? <IconLock className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
         </div>

         {error && <div className="p-3 bg-red-900/10 border border-red-900/30 text-red-500 text-xs font-bold uppercase text-center animate-pulse">{error}</div>}

         <button 
           onClick={handleLogin} 
           disabled={loading} 
           className="w-full py-5 bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 transition-colors"
         >
           {loading ? 'Authenticating...' : 'Enter System'}
         </button>
      </div>
    </div>
  );
};
