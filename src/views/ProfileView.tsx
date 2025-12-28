
import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { Header } from '../components/Header';
import { IconGrid, IconResonance } from '../components/Icons';
import { supabase } from '../services/supabaseClient';
import { PostDetailView } from './PostDetailView';
import { SettingsModal } from '../components/modals/SettingsModal';
import { apiClient } from '../services/apiClient';

interface ProfileViewProps {
  targetUserId?: string; // If null, show current user
  onBack: () => void;
  currentUser: User;
  onUpdateUser: (u: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ targetUserId, onBack, currentUser, onUpdateUser }) => {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const handleToggleLike = async (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    const isLiked = post.likedBy.includes(currentUser.id);
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
      const uid = targetUserId || currentUser.id;
      const { data: postData } = await supabase.from('posts').select('*').eq('author_id', uid).order('created_at', { ascending: false });
      if (postData) {
         setPosts(postData.map((p:any) => ({
             id: p.id.toString(),
             authorId: p.author_id,
             authorName: profileUser?.username || '',
             authorAvatar: profileUser?.avatarUrl,
             content: p.content,
             resonance: p.resonance || 0,
             likedBy: p.liked_by || [],
             timestamp: new Date(p.created_at).getTime(),
             tags: [],
             comments: [],
             commentCount: 0
         })));
      }
    }
  };

  const isOwnProfile = !targetUserId || targetUserId === currentUser.id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const uid = targetUserId || currentUser.id;

      let user: User | null = null;
      if (isOwnProfile) {
          user = currentUser;
      } else {
          const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
          if (data) {
             user = {
                 id: data.id,
                 username: data.username,
                 isVerified: true,
                 joinDate: data.created_at,
                 lastLogin: 0,
                 stats: data.stats || {},
                 tasks: [],
                 inventory: data.inventory || [],
                 manifesto: data.manifesto,
                 originStory: data.origin_story,
                 avatarUrl: data.avatar_url,
                 coverUrl: data.cover_url,
                 entropy: data.entropy,
                 following: data.following || []
             };
          }
      }
      setProfileUser(user);
      
      if (user) {
          const { data: postData } = await supabase.from('posts').select('*').eq('author_id', uid).order('created_at', { ascending: false });
          if (postData) {
             setPosts(postData.map((p:any) => ({
                 id: p.id.toString(),
                 authorId: p.author_id,
                 authorName: user?.username || '',
                 authorAvatar: user?.avatarUrl,
                 content: p.content,
                 resonance: p.resonance || 0,
                 likedBy: p.liked_by || [],
                 timestamp: new Date(p.created_at).getTime(),
                 tags: [],
                 comments: [],
                 commentCount: 0
             })));
          }
          if (!isOwnProfile && currentUser.following?.includes(uid)) setIsFollowing(true);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [targetUserId, currentUser]);

  const toggleFollow = async () => {
     if (isOwnProfile || !profileUser) return;
     let newFollowing = [...(currentUser.following || [])];
     if (isFollowing) newFollowing = newFollowing.filter(id => id !== profileUser.id);
     else newFollowing.push(profileUser.id);
     onUpdateUser({ ...currentUser, following: newFollowing });
     setIsFollowing(!isFollowing);
  };

  if (selectedPost) return <PostDetailView post={selectedPost} onBack={() => setSelectedPost(null)} onUpdate={() => {
    // Re-fetch posts if needed, though ProfileView has its own logic
    const uid = targetUserId || currentUser.id;
    supabase.from('posts').select('*').eq('author_id', uid).order('created_at', { ascending: false }).then(({ data }) => {
        if (data) {
            setPosts(data.map((p:any) => ({
                id: p.id.toString(),
                authorId: p.author_id,
                authorName: profileUser?.username || '',
                authorAvatar: profileUser?.avatarUrl,
                content: p.content,
                resonance: p.resonance || 0,
                likedBy: p.liked_by || [],
                timestamp: new Date(p.created_at).getTime(),
                tags: [],
                comments: [],
                commentCount: 0
            })));
        }
    });
  }} />;
  if (loading || !profileUser) return <div className="h-screen bg-void flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent animate-spin rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-void pb-20 font-sans text-slate-200">
       <Header title={profileUser.username} subtitle={profileUser.stats.class} onBack={onBack} />
       <div className="p-6">
           <div className="relative mb-12">
               {profileUser.coverUrl ? (
                   <img src={profileUser.coverUrl} className="h-32 w-full object-cover rounded-t-3xl" />
               ) : (
                   <div className="h-32 bg-slate-950 border border-blue-500/20 rounded-t-3xl relative overflow-hidden">
                       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
                       <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>
                   </div>
               )}
               <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                   <div className="w-28 h-28 rounded-2xl bg-black border-4 border-slate-900 p-1.5 shadow-2xl overflow-hidden">
                       <img src={profileUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.username}&backgroundColor=000000`} className="w-full h-full object-cover rounded-xl bg-slate-900" />
                   </div>
                   <div className="mt-[-12px] bg-white text-black px-3 py-0.5 rounded-sm font-black text-[10px] uppercase shadow-lg z-10 border border-slate-200">LVL {profileUser.stats.level}</div>
               </div>
           </div>
           <div className="text-center mb-8">
               <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{profileUser.username}</h1>
               <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">{profileUser.stats.class || "SCHOLAR"}</p>
           </div>
           <div className="space-y-6 max-w-sm mx-auto mb-10">
                <div>
                    <div className="flex justify-between text-[9px] uppercase font-black tracking-widest mb-1">
                        <span className="text-slate-400">Health Point</span>
                        <span className="text-slate-200">{profileUser.stats.health} / {profileUser.stats.maxHealth}</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${(profileUser.stats.health / profileUser.stats.maxHealth) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[9px] uppercase font-black tracking-widest mb-1">
                        <span className="text-slate-400">Resonance</span>
                        <span className="text-slate-200">{profileUser.stats.resonance} / {profileUser.stats.maxResonance}</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${(profileUser.stats.resonance / profileUser.stats.maxResonance) * 100}%` }}></div>
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[9px] uppercase font-black tracking-widest mb-1">
                        <span className="text-slate-400">Experience</span>
                        <span className="text-slate-200">{profileUser.stats.xp} / {profileUser.stats.xpToNextLevel}</span>
                    </div>
                    <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${(profileUser.stats.xp / profileUser.stats.xpToNextLevel) * 100}%` }}></div>
                    </div>
                </div>
           </div>
           <div className="mb-8">
               <p className="text-sm text-slate-300 font-serif italic mb-4 border-l-2 border-slate-800 pl-3">"{profileUser.manifesto || "Silence is the only truth."}"</p>
               {isOwnProfile ? (
                   <button onClick={() => setShowSettings(true)} className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800">Edit Signal</button>
               ) : (
                   <button onClick={toggleFollow} className={`w-full py-2 font-bold uppercase text-[10px] tracking-widest transition-colors ${isFollowing ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-white text-black'}`}>{isFollowing ? 'Disconnect' : 'Connect Signal'}</button>
               )}
           </div>
           {isOwnProfile ? (
               <div className="flex border-b border-slate-900 mb-4">
                   <button onClick={() => {}} className="flex-1 py-3 border-b-2 border-gold text-white flex justify-center"><IconGrid className="w-5 h-5" /></button>
                   <button onClick={() => {}} className="flex-1 py-3 text-slate-600 flex justify-center"><IconResonance className="w-5 h-5" /></button>
               </div>
           ) : null}
           <div className="grid grid-cols-3 gap-1">
               {posts.map(post => (
                   <div key={post.id} onClick={() => setSelectedPost(post)} className="aspect-square bg-slate-900 relative group cursor-pointer overflow-hidden border border-slate-950">
                       <div className="absolute inset-0 p-2 flex items-center justify-center"><p className="text-[6px] text-slate-500 line-clamp-6 text-center leading-relaxed">{post.content}</p></div>
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <div className="flex flex-col items-center gap-2">
                               <button onClick={(e) => handleToggleLike(post, e)} className={`flex items-center gap-1 transition-all ${post.likedBy.includes(currentUser.id) ? 'text-gold' : 'text-white'}`}>
                                   <IconResonance className={`w-4 h-4 ${post.likedBy.includes(currentUser.id) ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : ''}`} /><span className="text-xs font-bold">{post.resonance}</span>
                               </button>
                           </div>
                       </div>
                   </div>
               ))}
               {posts.length === 0 && <div className="col-span-3 py-10 text-center text-slate-600 text-[10px] uppercase">No signals transmitted.</div>}
           </div>
       </div>
       {showSettings && <SettingsModal user={currentUser} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
    </div>
  );
};
