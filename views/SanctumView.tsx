
import React, { useState, useEffect } from 'react';
import { Post, DailyQuote } from '../types';
import { getDailyWisdom } from '../services/geminiService';
import { Header } from '../components/Header';
import { ProfileView } from './ProfileView';
import { CreatePostModal } from '../components/modals/CreatePostModal';
import { IconResonance, IconPlus, IconUsers, IconGlobe, IconTrash, IconFeather } from '../components/Icons';
import { formatTime, loadUser } from '../utils/helpers';
import { PostDetailView } from './PostDetailView';
import { supabase } from '../services/supabaseClient';

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
    const { data } = await supabase.from('posts').select(`*, profiles(username, avatar_url, cover_url, stats)`).order('created_at', { ascending: false });
    if (data) {
      setPosts(data.map((p: any) => ({
        id: p.id,
        authorId: p.author_id,
        authorName: p.profiles?.username || 'The Council',
        authorAvatar: p.profiles?.avatar_url,
        authorClass: p.profiles?.stats?.class || 'System',
        content: p.content,
        resonance: p.resonance || 0,
        likedBy: p.liked_by || [],
        timestamp: new Date(p.created_at).getTime(),
        tags: [],
        comments: [],
        commentCount: 0,
        isSystemPost: !p.profiles
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    getDailyWisdom().then(q => setDailyQuote({ ...q, date: new Date().toISOString() }));
    fetchPosts();
  }, []);

  const handleCreatePost = async (content: string) => {
    if (!currentUser) return;
    await supabase.from('posts').insert({
      author_id: currentUser.id,
      content,
      created_at: new Date().toISOString(),
      resonance: 0,
      liked_by: []
    });
    fetchPosts();
  };

  const handleToggleLike = async (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    let newLikedBy = [...(post.likedBy || [])];
    const isLiked = newLikedBy.includes(currentUser.id);
    
    if (isLiked) {
      newLikedBy = newLikedBy.filter(id => id !== currentUser.id);
    } else {
      newLikedBy.push(currentUser.id);
    }

    const newResonance = isLiked ? post.resonance - 1 : post.resonance + 1;

    setPosts(posts.map(p => p.id === post.id ? { ...p, resonance: newResonance, likedBy: newLikedBy } : p));
    
    await supabase.from('posts').update({ 
      resonance: newResonance,
      liked_by: newLikedBy 
    }).eq('id', post.id);
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Extinguish this signal?")) return;
    await supabase.from('posts').delete().eq('id', postId);
    setPosts(posts.filter(p => p.id !== postId));
  };

  const visiblePosts = activeTab === 'GLOBAL' ? posts : posts.filter(p => currentUser?.following?.includes(p.authorId) || p.authorId === currentUser?.id);

  if (viewProfileId && currentUser) return <ProfileView targetUserId={viewProfileId} currentUser={currentUser} onBack={() => setViewProfileId(null)} onUpdateUser={() => {}} />;
  if (selectedPost) return <PostDetailView post={selectedPost} onBack={() => setSelectedPost(null)} />;

  return (
    <div className="min-h-screen bg-void pb-24 relative overflow-x-hidden">
      <Header title="Sanctum" subtitle="The Infinite Stream" />
      
      {/* Daily Wisdom UI */}
      {dailyQuote && (
        <div className="mx-6 mt-8 p-8 bg-gradient-to-br from-slate-900 to-black border border-gold/20 rounded-xl relative group overflow-hidden animate-fade-in shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <IconFeather className="w-24 h-24 text-gold" />
          </div>
          <p className="text-xl md:text-2xl font-serif italic text-white leading-relaxed mb-6">"{dailyQuote.text}"</p>
          <div className="flex items-center gap-2">
            <div className="h-[1px] w-8 bg-gold"></div>
            <span className="text-gold text-[10px] uppercase font-black tracking-widest">{dailyQuote.author}</span>
          </div>
        </div>
      )}

      <div className="flex border-b border-slate-900 sticky top-20 z-20 bg-black/90 backdrop-blur mt-8">
        <button onClick={() => setActiveTab('GLOBAL')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'GLOBAL' ? 'text-white border-b-2 border-white' : 'text-slate-600'}`}><IconGlobe className="w-4 h-4" /> The Void</button>
        <button onClick={() => setActiveTab('FOLLOWING')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest ${activeTab === 'FOLLOWING' ? 'text-white border-b-2 border-white' : 'text-slate-600'}`}><IconUsers className="w-4 h-4" /> Frequency</button>
      </div>

      <button onClick={() => setIsCreatingPost(true)} className="fixed bottom-24 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] z-30 transition-transform active:scale-95"><IconPlus className="w-8 h-8" /></button>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent animate-spin rounded-full"></div></div>
      ) : (
        <div className="px-4 space-y-6 mt-8 pb-12">
          {visiblePosts.map((post) => {
            const isLiked = currentUser && post.likedBy?.includes(currentUser.id);
            return (
              <div key={post.id} onClick={() => setSelectedPost(post)} className={`bg-slate-950/40 backdrop-blur border ${post.isSystemPost ? 'border-gold/30' : 'border-slate-900'} p-6 rounded-lg cursor-pointer hover:border-slate-700 transition-all group relative`}>
                <p className="text-white text-lg font-serif opacity-90 mb-6 leading-relaxed">{post.content}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div onClick={(e) => { e.stopPropagation(); setViewProfileId(post.authorId); }} className="w-10 h-10 rounded-full border border-slate-800 overflow-hidden bg-black shadow-lg">
                      <img src={post.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}&backgroundColor=000000`} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <button onClick={(e) => { e.stopPropagation(); setViewProfileId(post.authorId); }} className="text-white font-black uppercase text-xs hover:underline block text-left">{post.authorName}</button>
                      <p className="text-gold text-[9px] uppercase font-black tracking-tighter">{post.authorClass}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center">
                    {currentUser?.id === post.authorId && (
                      <button onClick={(e) => handleDeletePost(post.id, e)} className="text-slate-700 hover:text-red-500 transition-colors"><IconTrash className="w-4 h-4" /></button>
                    )}
                    <button onClick={(e) => handleToggleLike(post, e)} className={`flex flex-col items-center gap-1 transition-colors ${isLiked ? 'text-gold' : 'text-slate-600 hover:text-white'}`}>
                      <IconResonance className="w-5 h-5" />
                      <span className="text-[9px] font-black">{post.resonance}</span>
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
