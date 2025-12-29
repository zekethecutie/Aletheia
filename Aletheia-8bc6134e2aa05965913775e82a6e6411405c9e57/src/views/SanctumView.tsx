import React, { useState, useEffect } from 'react';
import { Post, DailyQuote } from '../types';
import { apiClient } from '../services/apiClient';
import { Header } from '../components/Header';
import { ProfileView } from './ProfileView';
import { CreatePostModal } from '../components/modals/CreatePostModal';
import { IconResonance, IconPlus, IconUsers, IconGlobe, IconTrash, IconFeather, IconEdit, IconMirror } from '../components/Icons';
import { formatTime, loadUser } from '../utils/helpers';
import { PostDetailView } from './PostDetailView';

export const SanctumView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'FOLLOWING'>('GLOBAL');
  const [posts, setPosts] = useState<Post[]>([]);
  const [dailyQuote, setDailyQuote] = useState<DailyQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const currentUser = loadUser();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getPosts();
      setPosts(data.map((p: any) => ({
        id: p.id.toString(),
        authorId: p.author_id,
        authorName: p.username || 'The Council',
        authorAvatar: p.avatar_url,
        authorClass: p.author_class || 'System',
        content: p.content,
        resonance: p.resonance || 0,
        likedBy: p.liked_by || [],
        timestamp: new Date(p.created_at).getTime(),
        tags: [],
        comments: [],
        commentCount: 0,
        isSystemPost: !!p.is_system_post
      })));
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
    apiClient.getDailyWisdom().then(q => {
      if (q && q.text) {
        setDailyQuote({ ...q, date: new Date().toISOString() });
      }
    }).catch(err => {
      console.warn("Daily wisdom fetch failed:", err);
      setDailyQuote({ text: "Silence is the void's most eloquent whisper.", author: "The Council", date: new Date().toISOString() });
    });
  }, []);

  const handleCreatePost = async (content: string) => {
    if (!currentUser) return;
    try {
      await apiClient.createPost(currentUser.id, content);
      setIsCreatingPost(false);
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Transmission failed. The void is unstable.");
    }
  };

    const handleToggleLike = async (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    const isLiked = post.likedBy.includes(currentUser.id);
    
    // Toggle logic: prevent infinite addition, properly remove ID
    const newLikedBy = isLiked 
      ? post.likedBy.filter(id => id !== currentUser.id)
      : [...post.likedBy, currentUser.id];
    
    setPosts(prev => prev.map(p => 
      p.id === post.id 
        ? { ...p, likedBy: newLikedBy, resonance: newLikedBy.length } 
        : p
    ));

    try {
      const res = await apiClient.toggleLikePost(parseInt(post.id), currentUser.id);
      if (res.success) {
          setPosts(prev => prev.map(p => 
            p.id === post.id 
              ? { ...p, likedBy: res.isLiked ? [...p.likedBy, currentUser.id] : p.likedBy.filter(id => id !== currentUser.id), resonance: res.resonance } 
              : p
          ));
      }
    } catch (error) {
      console.error("Error liking post:", error);
      fetchPosts(); // Rollback on error
    }
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Extinguish this signal?")) return;
    setPosts(posts.filter(p => p.id !== postId));
  };

  const visiblePosts = activeTab === 'GLOBAL' ? posts : posts.filter(p => currentUser?.following?.includes(p.authorId) || p.authorId === currentUser?.id);

  if (viewProfileId && currentUser) return <ProfileView targetUserId={viewProfileId} currentUser={currentUser} onBack={() => setViewProfileId(null)} onUpdateUser={() => {}} />;
  if (selectedPost) return <PostDetailView post={selectedPost} onBack={() => setSelectedPost(null)} onUpdate={fetchPosts} />;

  return (
    <div className="min-h-screen bg-void pb-24 relative overflow-x-hidden">
      <Header title="Sanctum" subtitle="The Infinite Stream" />
      
      <div className="flex border-b border-slate-900 sticky top-20 z-20 bg-black/90 backdrop-blur">
        <button onClick={() => setActiveTab('GLOBAL')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'GLOBAL' ? 'text-white border-b-2 border-white' : 'text-slate-600'}`}><IconGlobe className="w-4 h-4" /> The Void</button>
        <button onClick={() => setActiveTab('FOLLOWING')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'FOLLOWING' ? 'text-white border-b-2 border-white' : 'text-slate-600'}`}><IconUsers className="w-4 h-4" /> Frequency</button>
      </div>

      {dailyQuote && (
        <div className="mx-6 mt-8 p-6 glass-card rounded-2xl relative group overflow-hidden animate-blur-in shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
              <div className="w-10 h-10 glass-card rounded-xl flex items-center justify-center relative z-10 border-blue-500/30">
                <IconMirror className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-white font-display font-black text-[10px] tracking-[0.4em] uppercase">Transmission Received</p>
              <p className="text-blue-400/50 text-[8px] tracking-[0.2em] uppercase font-mono mt-1">From: The Council</p>
            </div>
          </div>

          <div className="pl-4 border-l-2 border-blue-500/40 py-1 mb-4">
            <p className="text-[9px] text-blue-400 font-display font-black tracking-[0.3em] uppercase mb-2 opacity-50">Sacred Wisdom</p>
            <p className="text-xl md:text-2xl font-serif italic text-white leading-relaxed tracking-wide">
              "{dailyQuote.text}"
            </p>
            <p className="text-blue-400/60 text-[10px] uppercase font-display font-black tracking-[0.2em] mt-2">— {dailyQuote.author}</p>
          </div>
        </div>
      )}

      <button onClick={() => setIsCreatingPost(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] z-30 transition-transform active:scale-95"><IconPlus className="w-8 h-8" /></button>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent animate-spin rounded-full"></div></div>
      ) : (
        <div className="px-4 space-y-4 mt-6 pb-12">
          {visiblePosts.map((post) => {
            const isLiked = currentUser && post.likedBy?.includes(currentUser.id);
            return (
              <div key={post.id} onClick={() => setSelectedPost(post)} className={`glass-card p-6 rounded-2xl cursor-pointer hover:border-blue-500/40 transition-all group relative overflow-hidden animate-fade-in-up shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${post.isSystemPost ? 'border-blue-500/30' : 'border-white/5'}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-white text-lg font-serif italic opacity-90 mb-6 leading-relaxed tracking-wide">"{post.content}"</p>
                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <div className="flex items-center gap-3">
                    <div onClick={(e) => { e.stopPropagation(); setViewProfileId(post.authorId); }} className="w-10 h-10 rounded-xl border border-white/10 overflow-hidden bg-black shadow-2xl transition-transform group-hover:scale-105">
                      <img src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <button onClick={(e) => { e.stopPropagation(); setViewProfileId(post.authorId); }} className="text-white font-display font-black uppercase text-[9px] tracking-[0.2em] hover:text-blue-400 block text-left transition-colors">{post.authorName}</button>
                      <p className="text-blue-400/50 text-[7px] uppercase font-display font-black tracking-[0.3em] mt-1">{post.authorClass}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentUser) {
                          const reason = prompt("State the reason for this report:");
                          if (reason) apiClient.reportPost(currentUser.id, post.authorId, parseInt(post.id), reason).then(() => alert("Report filed with the Council."));
                        }
                      }}
                      className="text-slate-700 hover:text-red-500 transition-colors"
                      title="Report Post"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </button>
                    {currentUser?.id === post.authorId && (
                      <button onClick={(e) => handleDeletePost(post.id, e)} className="text-slate-700 hover:text-crimson transition-colors"><IconTrash className="w-4 h-4" /></button>
                    )}
                    <button onClick={(e) => handleToggleLike(post, e)} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-blue-400' : 'text-slate-600 hover:text-white'}`}>
                      <IconResonance className={`w-5 h-5 ${isLiked ? 'drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : ''}`} />
                      <span className="text-[10px] font-black font-mono">{post.resonance}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {isCreatingPost && <CreatePostModal onClose={() => setIsCreatingPost(false)} onSubmit={handleCreatePost} />}
    </div>
  );
};
