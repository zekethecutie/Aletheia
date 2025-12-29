
import React, { useState, useEffect } from 'react';
import { Post, Comment } from '../types';
import { Header } from '../components/Header';
import { IconResonance, IconMessage, IconSend, IconTrash, IconStar } from '../components/Icons';
import { apiClient } from '../services/apiClient';
import { loadUser, formatTime } from '../utils/helpers';

export const PostDetailView: React.FC<{ post: Post; onBack: () => void; onUpdate: () => void }> = ({ post, onBack, onUpdate }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const currentUser = loadUser();
  const isLiked = currentUser && post.likedBy?.includes(currentUser.id);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await apiClient.getComments(post.id);
        const mapComments = (list: any[], parentId: number | null = null): Comment[] => {
          return list
            .filter(c => c.parent_id === parentId)
            .map(c => ({
              id: c.id.toString(),
              authorId: c.author_id,
              authorName: c.username || 'Initiate',
              authorAvatar: c.avatar_url,
              content: c.content,
              timestamp: new Date(c.created_at).getTime(),
              parent_id: c.parent_id,
              replies: mapComments(list, c.id)
            }));
        };
        setComments(mapComments(data));
      } catch (e) { console.error(e); }
    };
    fetchComments();
  }, [post.id]);

  const handleAddComment = async (parentId?: number) => {
    const text = parentId ? replyText : newComment;
    if (!text.trim() || loading || !currentUser) return;
    setLoading(true);
    try {
      const res = await apiClient.createComment(post.id, currentUser.id, text, parentId);
      if (res) {
        if (parentId) {
          setReplyText('');
          setReplyingTo(null);
        } else {
          setNewComment('');
        }
        onUpdate();
        // Refresh
        const data = await apiClient.getComments(post.id);
        const mapComments = (list: any[], pId: number | null = null): Comment[] => {
          return list
            .filter(c => c.parent_id === pId)
            .map(c => ({
              id: c.id.toString(),
              authorId: c.author_id,
              authorName: c.username || 'Initiate',
              authorAvatar: c.avatar_url,
              content: c.content,
              timestamp: new Date(c.created_at).getTime(),
              parent_id: c.parent_id,
              replies: mapComments(list, c.id)
            }));
        };
        setComments(mapComments(data));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleToggleLike = async () => {
    if (!currentUser) return;
    try {
      await apiClient.toggleLikePost(parseInt(post.id), currentUser.id);
      onUpdate();
    } catch (e) { console.error(e); }
  };

  const CommentItem: React.FC<{ comment: Comment, depth?: number }> = ({ comment, depth = 0 }) => (
    <div className={`space-y-4 ${depth > 0 ? 'ml-8 border-l border-white/5 pl-4' : ''}`}>
      <div className="bg-slate-950/20 border border-white/5 p-4 rounded-xl flex gap-4">
        <div className="w-8 h-8 rounded-lg border border-white/10 overflow-hidden shrink-0">
          <img src={comment.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-black uppercase text-[8px] tracking-widest">{comment.authorName}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setReplyingTo(replyingTo === parseInt(comment.id) ? null : parseInt(comment.id))} className="text-[7px] uppercase font-black text-blue-400 hover:text-white transition-colors">Reply</button>
              <span className="text-slate-600 text-[7px] font-mono">{formatTime(comment.timestamp)}</span>
            </div>
          </div>
          <p className="text-slate-300 text-sm font-serif italic">"{comment.content}"</p>
          
          {replyingTo === parseInt(comment.id) && (
            <div className="mt-4 flex gap-2">
              <input 
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 p-2 text-white text-[10px] outline-none rounded-lg"
                placeholder="Type your reply..."
                autoFocus
              />
              <button onClick={() => handleAddComment(parseInt(comment.id))} className="px-3 bg-blue-500 text-white text-[8px] font-black uppercase rounded-lg">Send</button>
            </div>
          )}
        </div>
      </div>
      {comment.replies?.map(reply => <CommentItem key={reply.id} comment={reply} depth={depth + 1} />)}
    </div>
  );

  return (
    <div className="min-h-screen bg-void pb-24 animate-fade-in relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent opacity-40"></div>
      <Header title="Transmission" subtitle="Detail Analysis" onBack={onBack} />
      
      <div className="max-w-xl mx-auto px-4 mt-6 space-y-6 relative z-10">
        <div className="bg-slate-950/40 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl border-2 border-white/10 overflow-hidden bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:border-blue-500/50">
              <img src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase text-xs tracking-[0.4em] mb-1">{post.authorName}</h3>
              <div className="flex items-center gap-2">
                <span className="h-[1px] w-4 bg-blue-500/50"></span>
                <p className="text-blue-400 text-[8px] uppercase font-black tracking-[0.5em]">{post.authorClass}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={(e) => {
                  const reason = prompt("State the reason for this report:");
                  if (reason) apiClient.reportPost(currentUser!.id, post.authorId, parseInt(post.id), reason).then(() => alert("Report filed."));
                }}
                className="p-2 text-slate-700 hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </button>
              <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <p className="text-slate-500 text-[7px] uppercase font-black tracking-[0.2em]">{formatTime(post.timestamp)}</p>
              </div>
            </div>
          </div>

          <p className="text-white text-xl md:text-2xl font-serif italic leading-[1.4] tracking-tight mb-10 opacity-100 drop-shadow-sm">
            "{post.content}"
          </p>

          <div className="flex items-center gap-8 border-t border-white/10 pt-6">
            <button onClick={handleToggleLike} className={`flex items-center gap-3 transition-all cursor-pointer group/stat ${isLiked ? 'text-blue-400' : 'text-slate-500 hover:text-white'} hover:scale-105`}>
              <div className={`p-2 rounded-xl border border-white/10 ${isLiked ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5'} group-hover/stat:border-blue-400 transition-all`}>
                <IconResonance className={`w-5 h-5 ${isLiked ? 'drop-shadow-[0_0_15px_rgba(96,165,250,0.8)]' : ''}`} />
              </div>
              <div>
                <span className="text-xs font-black block">{post.resonance}</span>
                <span className="text-[7px] uppercase font-black tracking-widest opacity-50">Resonance</span>
              </div>
            </button>
            <div className="flex items-center gap-3 text-slate-500 group/stat">
              <div className="p-2 rounded-xl border border-white/10 bg-white/5">
                <IconMessage className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black block">{comments.length}</span>
                <span className="text-[7px] uppercase font-black tracking-widest opacity-50">Fragments</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-[0.5em] mb-4">Frequency Response</h4>
           
           <div className="space-y-4 mb-6">
             {comments.map(comment => <CommentItem key={comment.id} comment={comment} />)}
           </div>

           <div className="relative">
             <textarea 
               value={newComment} 
               onChange={(e) => setNewComment(e.target.value)}
               className="w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all placeholder-slate-700 resize-none h-24 font-serif italic"
               placeholder="Transmit your resonance fragment..."
             />
             <button 
               onClick={() => handleAddComment()}
               disabled={!newComment.trim() || loading}
               className="absolute bottom-3 right-3 bg-white text-black px-4 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-500 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"
             >
               <IconSend className="w-3 h-3" />
               Transmit
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
