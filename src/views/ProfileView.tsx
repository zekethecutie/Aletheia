
import React, { useState, useEffect } from 'react';
import { User, Post, ViewState } from '../types';
import { Header } from '../components/Header';
import { IconGrid, IconSettings, IconUsers, IconResonance, IconScroll } from '../components/Icons';
import { supabase } from '../services/supabaseClient';
import { loadUser } from '../utils/helpers';
import { PostDetailView } from './PostDetailView';
import { SettingsModal } from '../components/modals/SettingsModal';

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

  const isOwnProfile = !targetUserId || targetUserId === currentUser.id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const uid = targetUserId || currentUser.id;

      // 1. Get Profile
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
      
      // 2. Get Posts
      if (user) {
          const { data: postData } = await supabase
            .from('posts')
            .select('*')
            .eq('author_id', uid)
            .order('created_at', { ascending: false });
          
          if (postData) {
             setPosts(postData.map((p:any) => ({
                 id: p.id,
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

          if (!isOwnProfile && currentUser.following?.includes(uid)) {
              setIsFollowing(true);
          }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [targetUserId, currentUser]);

  const toggleFollow = async () => {
     if (isOwnProfile || !profileUser) return;
     
     let newFollowing = [...(currentUser.following || [])];
     if (isFollowing) {
         newFollowing = newFollowing.filter(id => id !== profileUser.id);
     } else {
         newFollowing.push(profileUser.id);
     }
     
     // Update Local
     const updatedMe = { ...currentUser, following: newFollowing };
     onUpdateUser(updatedMe); // This triggers DB sync in App.tsx
     setIsFollowing(!isFollowing);
  };

  if (selectedPost) {
      return <PostDetailView post={selectedPost} onBack={() => setSelectedPost(null)} />;
  }

  if (loading || !profileUser) {
      return <div className="h-screen bg-void flex items-center justify-center"><div className="w-6 h-6 border-2 border-gold border-t-transparent animate-spin rounded-full"></div></div>;
  }

  return (
    <div className="min-h-screen bg-void pb-20 font-sans text-slate-200">
       <Header title={profileUser.username} subtitle={profileUser.stats.class} onBack={onBack} />
       
       <div className="p-6">
           {/* Header Stats */}
           <div className="flex items-start gap-6 mb-8">
               <div className="w-20 h-20 rounded-full border-2 border-gold p-1 flex-shrink-0">
                   <img 
                      src={profileUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.username}&backgroundColor=000000`} 
                      className="w-full h-full object-cover rounded-full bg-slate-900"
                   />
               </div>
               
               <div className="flex-1 flex justify-around items-center h-20">
                   <div className="text-center">
                       <div className="text-lg font-black text-white">{posts.length}</div>
                       <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Signals</div>
                   </div>
                   <div className="text-center">
                       <div className="text-lg font-black text-white">{profileUser.stats.level}</div>
                       <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Level</div>
                   </div>
                   <div className="text-center">
                       <div className="text-lg font-black text-white">{profileUser.following?.length || 0}</div>
                       <div className="text-[9px] uppercase font-bold text-slate-500 tracking-widest">Following</div>
                   </div>
               </div>
           </div>

           {/* Bio / Action */}
           <div className="mb-8">
               <p className="text-sm text-slate-300 font-serif italic mb-4 border-l-2 border-slate-800 pl-3">"{profileUser.manifesto || "Silence is the only truth."}"</p>
               
               {isOwnProfile ? (
                   <button 
                      onClick={() => setShowSettings(true)}
                      className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800"
                   >
                       Edit Signal
                   </button>
               ) : (
                   <button 
                      onClick={toggleFollow}
                      className={`w-full py-2 font-bold uppercase text-[10px] tracking-widest transition-colors ${isFollowing ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-white text-black'}`}
                   >
                       {isFollowing ? 'Disconnect' : 'Connect Signal'}
                   </button>
               )}
           </div>

           {/* Tabs (Visual only for now) */}
           <div className="flex border-b border-slate-900 mb-4">
               <button className="flex-1 py-3 border-b-2 border-gold text-white flex justify-center"><IconGrid className="w-5 h-5" /></button>
               <button className="flex-1 py-3 text-slate-600 flex justify-center"><IconResonance className="w-5 h-5" /></button>
           </div>

           {/* Post Grid */}
           <div className="grid grid-cols-3 gap-1">
               {posts.map(post => (
                   <div key={post.id} onClick={() => setSelectedPost(post)} className="aspect-square bg-slate-900 relative group cursor-pointer overflow-hidden border border-slate-950">
                       {/* If post has an image we'd show it, but for text posts we show a typographic preview */}
                       <div className="absolute inset-0 p-2 flex items-center justify-center">
                           <p className="text-[6px] text-slate-500 line-clamp-6 text-center leading-relaxed">{post.content}</p>
                       </div>
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                           <div className="flex items-center gap-1 text-white">
                               <IconResonance className="w-4 h-4 text-gold" />
                               <span className="text-xs font-bold">{post.resonance}</span>
                           </div>
                       </div>
                   </div>
               ))}
               {posts.length === 0 && (
                   <div className="col-span-3 py-10 text-center text-slate-600 text-[10px] uppercase">No signals transmitted.</div>
               )}
           </div>
       </div>

       {showSettings && <SettingsModal user={currentUser} onClose={() => setShowSettings(false)} onUpdate={onUpdateUser} />}
    </div>
  );
};
