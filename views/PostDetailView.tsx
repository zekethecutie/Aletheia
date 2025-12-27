
import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { Header } from '../components/Header';
import { IconSend, IconResonance } from '../components/Icons';
import { formatTime, loadUser } from '../utils/helpers';
import { supabase } from '../services/supabaseClient';

const RecursiveComment: React.FC<{ comment: Comment; depth?: number; onReply: (id: string, author: string) => void }> = ({ comment, depth = 0, onReply }) => {
  const bgShade = depth % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/40';
  
  return (
    <div className={`flex flex-col gap-4 animate-slide-up ${depth > 0 ? 'ml-6 mt-4 border-l border-slate-800/50 pl-4' : ''}`}>
       <div className="flex gap-4">
         <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
            <img 
              src={comment.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.authorName}&backgroundColor=000000`} 
              alt="avatar" 
              className="w-full h-full object-cover" 
            />
         </div>
         <div className="flex-1 space-y-2">
            <div className={`${bgShade} p-4 rounded-lg border border-slate-900/50`}>
              <div className="flex justify-between items-center mb-1">
                 <span className="text-gold text-[10px] font-black uppercase tracking-widest">{comment.authorName}</span>
                 <span className="text-slate-600 text-[9px]">{formatTime(comment.timestamp)}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{comment.content}</p>
            </div>
            <button 
              onClick={() => onReply(comment.id, comment.authorName)} 
              className="text-[10px] text-slate-500 uppercase font-black hover:text-white transition-colors px-2 py-1"
            >
              Reply
            </button>
         </div>
       </div>
       
       {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map(reply => (
              <RecursiveComment key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} />
            ))}
          </div>
       )}
    </div>
  );
};

export const PostDetailView: React.FC<{ post: Post; onBack: () => void }> = ({ post, onBack }) => {
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string, author: string } | null>(null);
  const [resonance, setResonance] = useState(post.resonance);
  const currentUser = loadUser();
  const isLiked = currentUser && post.likedBy?.includes(currentUser.id);

  const addCommentToTree = (list: Comment[], parentId: string, newComm: Comment): Comment[] => {
    return list.map(c => {
      if (c.id === parentId) return { ...c, replies: [...c.replies, newComm] };
      if (c.replies.length > 0) return { ...c, replies: addCommentToTree(c.replies, parentId, newComm) };
      return c;
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !currentUser) return;
    const comm: Comment = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatarUrl,
      content: newComment,
      timestamp: Date.now(),
      replies: []
    };
    if (replyingTo) {
      setComments(addCommentToTree(comments, replyingTo.id, comm));
      setReplyingTo(null);
    } else {
      setComments([comm, ...comments]);
    }
    setNewComment('');
  };

  const handleToggleLike = async () => {
     if (!currentUser) return;
     const newRes = isLiked ? resonance - 1 : resonance + 1;
     setResonance(newRes);
     // Update DB logic here
     await supabase.from('posts').update({ resonance: newRes }).eq('id', post.id);
  };

  return (
    <div className="min-h-screen bg-void pb-24 animate-fade-in">
       <Header title="Sanctum" subtitle="The Thread" onBack={onBack} />
       
       <div className="p-6 border-b border-slate-900 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
               <img src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
            </div>
            <div>
               <h3 className="text-white font-black uppercase text-sm tracking-wide">{post.authorName}</h3>
               <p className="text-gold text-[9px] uppercase font-bold tracking-widest">{post.authorClass}</p>
            </div>
          </div>
          <p className="text-white text-xl font-serif leading-relaxed opacity-90 mb-6">{post.content}</p>
          <div className="flex items-center gap-6">
             <button onClick={handleToggleLike} className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors ${isLiked ? 'text-gold' : 'text-slate-600'}`}>
                <IconResonance className="w-5 h-5" />
                <span>{resonance} Resonance</span>
             </button>
             <span className="text-slate-600 text-xs font-black uppercase tracking-widest">{comments.length} Echoes</span>
          </div>
       </div>

       <div className="p-6 space-y-6">
          <div className="sticky top-24 z-30 bg-slate-950 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
             {replyingTo && (
               <div className="flex justify-between items-center text-[10px] text-gold px-2">
                 <span>Replying to {replyingTo.author}</span>
                 <button onClick={() => setReplyingTo(null)} className="text-slate-500 font-black">X</button>
               </div>
             )}
             <div className="flex gap-2">
               <input value={newComment} onChange={e => setNewComment(e.target.value)} className="flex-1 bg-transparent p-2 text-white text-sm outline-none placeholder-slate-700" placeholder="Add an echo..." />
               <button onClick={handleAddComment} className="px-4 bg-white text-black rounded"><IconSend className="w-4 h-4" /></button>
             </div>
          </div>

          <div className="space-y-6 pb-20">
            {comments.map(c => <RecursiveComment key={c.id} comment={c} onReply={(id, auth) => setReplyingTo({id, author: auth})} />)}
          </div>
       </div>
    </div>
  );
};
