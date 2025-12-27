
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
        <div className="bg-slate-950/40 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)]"></div>
          
          <div className="flex items-center gap-6 mb-12">
            <div className="w-20 h-20 rounded-2xl border-2 border-white/10 overflow-hidden bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-indigo-500/50">
              <img src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase text-sm tracking-[0.4em] mb-2">{post.authorName}</h3>
              <div className="flex items-center gap-3">
                <span className="h-[1px] w-6 bg-indigo-500/50"></span>
                <p className="text-indigo-400 text-[10px] uppercase font-black tracking-[0.5em]">{post.authorClass}</p>
              </div>
            </div>
            <div className="ml-auto text-right">
              <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-2">
                <p className="text-slate-500 text-[8px] uppercase font-black tracking-[0.2em]">{formatTime(post.timestamp)}</p>
              </div>
            </div>
          </div>

          <p className="text-white text-3xl md:text-4xl font-serif italic leading-[1.4] tracking-tight mb-16 opacity-100 drop-shadow-sm">
            "{post.content}"
          </p>

          <div className="flex items-center gap-12 border-t border-white/10 pt-10">
            <div className={`flex items-center gap-4 transition-all cursor-pointer group/stat ${isLiked ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}>
              <div className={`p-3 rounded-xl border border-white/10 ${isLiked ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5'}`}>
                <IconResonance className={`w-7 h-7 ${isLiked ? 'drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]' : ''}`} />
              </div>
              <div>
                <span className="text-sm font-black block">{post.resonance}</span>
                <span className="text-[8px] uppercase font-black tracking-widest opacity-50">Resonance</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-slate-500 group/stat">
              <div className="p-3 rounded-xl border border-white/10 bg-white/5">
                <IconMessage className="w-7 h-7" />
              </div>
              <div>
                <span className="text-sm font-black block">{post.commentCount}</span>
                <span className="text-[8px] uppercase font-black tracking-widest opacity-50">Fragments</span>
              </div>
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
