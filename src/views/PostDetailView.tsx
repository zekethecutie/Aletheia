
import React, { useState, useEffect } from 'react';
import { Post, Comment } from '../types';
import { Header } from '../components/Header';
import { IconResonance, IconMessage, IconSend, IconTrash, IconStar } from '../components/Icons';
import { apiClient } from '../services/apiClient';
import { loadUser, formatTime } from '../utils/helpers';

export const PostDetailView: React.FC<{ post: Post; onBack: () => void; onUpdate: () => void }> = ({ post, onBack, onUpdate }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const currentUser = loadUser();

  const isLiked = currentUser && post.likedBy?.includes(currentUser.id);

  return (
    <div className="min-h-screen bg-void pb-24 animate-fade-in relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent opacity-40"></div>
      <Header title="Transmission" subtitle="Detail Analysis" onBack={onBack} />
      
      <div className="max-w-2xl mx-auto px-6 mt-8 space-y-8 relative z-10">
        <div className="glass-card p-10 rounded-3xl border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          <div className="flex items-center gap-5 mb-10">
            <div className="w-16 h-16 rounded-2xl border border-white/10 overflow-hidden bg-black shadow-2xl transition-transform group-hover:scale-105">
              <img src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-display font-black uppercase text-xs tracking-[0.3em]">{post.authorName}</h3>
              <p className="text-indigo-400 text-[9px] uppercase font-display font-black tracking-[0.4em] mt-1.5">{post.authorClass}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-slate-600 text-[8px] uppercase font-mono tracking-widest">{formatTime(post.timestamp)}</p>
            </div>
          </div>

          <p className="text-white text-2xl md:text-3xl font-serif italic leading-relaxed tracking-wide mb-12 opacity-95">
            "{post.content}"
          </p>

          <div className="flex items-center gap-8 border-t border-white/5 pt-8">
            <div className={`flex items-center gap-3 transition-all ${isLiked ? 'text-indigo-400' : 'text-slate-600'}`}>
              <IconResonance className={`w-6 h-6 ${isLiked ? 'drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]' : ''}`} />
              <span className="text-xs font-black font-mono">{post.resonance} Resonance</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <IconMessage className="w-6 h-6" />
              <span className="text-xs font-black font-mono">{post.commentCount} Fragments</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-[0.5em] mb-4">Frequency Response</h4>
           <div className="relative">
             <textarea 
               value={newComment} 
               onChange={(e) => setNewComment(e.target.value)}
               className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-6 text-white text-sm outline-none focus:border-indigo-500/50 transition-all placeholder-slate-700 resize-none h-32 font-serif italic"
               placeholder="Transmit your resonance fragment..."
             />
             <button 
               disabled={!newComment.trim() || loading}
               className="absolute bottom-4 right-4 bg-white text-black px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"
             >
               <IconSend className="w-3.5 h-3.5" />
               Transmit
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
