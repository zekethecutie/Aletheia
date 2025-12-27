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
      await apiClient.toggleLikePost(parseInt(post.id), currentUser.id);
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
        <div className="mx-6 mt-8 p-10 glass-card rounded-2xl relative group overflow-hidden animate-blur-in shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent"></div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full animate-pulse"></div>
              <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center relative z-10 border-gold/30">
                <IconMirror className="w-6 h-6 text-gold animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-white font-display font-black text-[10px] tracking-[0.4em] uppercase">Transmission Received</p>
              <p className="text-gold/50 text-[8px] tracking-[0.2em] uppercase font-mono mt-1">From: The Council</p>
            </div>
          </div>

          <div className="pl-6 border-l-2 border-gold/40 py-2 mb-8">
            <p className="text-[9px] text-gold font-display font-black tracking-[0.3em] uppercase mb-4 opacity-50">Sacred Wisdom</p>
            <p className="text-2xl md:text-3xl font-serif italic text-white leading-relaxed tracking-wide">
              "{dailyQuote.text}"
            </p>
            <p className="text-gold/60 text-[10px] uppercase font-display font-black tracking-[0.2em] mt-4">— {dailyQuote.author}</p>
          </div>
        </div>
      )}

      <button onClick={() => setIsCreatingPost(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] z-30 transition-transform active:scale-95"><IconPlus className="w-8 h-8" /></button>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent animate-spin rounded-full"></div></div>
      ) : (
        <div className="px-4 space-y-6 mt-8 pb-12">
          {visiblePosts.map((post) => {
            const isLiked = currentUser && post.likedBy?.includes(currentUser.id);
            return (
              <div key={post.id} onClick={() => setSelectedPost(post)} className={`glass-card p-8 rounded-2xl cursor-pointer hover:border-gold/40 transition-all group relative overflow-hidden animate-fade-in-up shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${post.isSystemPost ? 'border-gold/30' : 'border-white/5'}`}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="text-white text-xl font-serif italic opacity-90 mb-8 leading-relaxed tracking-wide">"{post.content}"</p>
                <div className="flex justify-between items-center border-t border-white/5 pt-6">
                  <div className="flex items-center gap-4">
                    <div onClick={(e) => { e.stopPropagation(); setViewProfileId(post.authorId); }} className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden bg-black shadow-2xl transition-transform group-hover:scale-105">
                      <img src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <button onClick={(e) => { e.stopPropagation(); setViewProfileId(post.authorId); }} className="text-white font-display font-black uppercase text-[10px] tracking-[0.2em] hover:text-gold block text-left transition-colors">{post.authorName}</button>
                      <p className="text-gold/50 text-[8px] uppercase font-display font-black tracking-[0.3em] mt-1">{post.authorClass}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center">
                    {currentUser?.id === post.authorId && (
                      <button onClick={(e) => handleDeletePost(post.id, e)} className="text-slate-700 hover:text-crimson transition-colors"><IconTrash className="w-4 h-4" /></button>
                    )}
                    <button onClick={(e) => handleToggleLike(post, e)} className={`flex items-center gap-2 transition-all ${isLiked ? 'text-gold' : 'text-slate-600 hover:text-white'}`}>
                      <IconResonance className={`w-5 h-5 ${isLiked ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : ''}`} />
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
