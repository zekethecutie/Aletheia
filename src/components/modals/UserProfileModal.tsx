
import React from 'react';
import { IconX } from '../Icons';

export const UserProfileModal: React.FC<{ author: string; onClose: () => void }> = ({ author, onClose }) => (
  <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 animate-fade-in backdrop-blur-md" onClick={onClose}>
    <div className="bg-slate-950 border border-slate-800 p-0 max-w-sm w-full relative shadow-2xl shadow-black rounded-sm overflow-hidden" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-red-500 transition-colors z-20"><IconX className="w-6 h-6" /></button>
      
      {/* Hunter Card Header Style */}
      <div className="h-32 bg-gradient-to-b from-slate-900 to-black relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
      </div>

      <div className="px-8 pb-8 -mt-16 relative">
          <div className="w-24 h-24 rounded-lg bg-black border-2 border-gold overflow-hidden mb-4 shadow-lg">
             <img 
               src={`https://api.dicebear.com/7.x/initials/svg?seed=${author}&backgroundColor=000000`} 
               alt={author} 
               className="w-full h-full object-cover"
             />
          </div>

          <div className="flex flex-col mb-6">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{author}</h3>
            <p className="text-gold text-[10px] uppercase font-bold tracking-[0.3em] mt-1">Void Walker</p> 
          </div>

          <div className="space-y-4 border-t border-slate-900 pt-6">
            <div className="flex justify-between text-sm items-center bg-slate-900/50 p-3 border border-slate-800">
               <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Rank</span>
               <span className="text-white font-black text-lg">C-Rank</span>
            </div>
            <div className="flex justify-between text-sm items-center bg-slate-900/50 p-3 border border-slate-800">
               <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Resonance</span>
               <span className="text-white font-mono font-bold">842</span>
            </div>
          </div>
          
          <button className="w-full mt-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 transition-transform hover:scale-[1.02]">Connect Signal</button>
      </div>
    </div>
  </div>
);
