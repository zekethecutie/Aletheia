import React, { useState, useEffect } from 'react';
import { ViewState, User } from './types';
import { NavBar } from './components/NavBar';
import { loadUser, saveUser, clearUser } from './utils/helpers';
import { apiClient } from './services/apiClient';

import { IntroView } from './views/IntroView';
import { AuthChoiceView, CreateIdentityView, EmbarkView } from './views/AuthView';
import { SanctumView } from './views/SanctumView';
import { SystemView } from './views/SystemView';
import { HierarchyView } from './views/HierarchyView';
import { ConsultantView } from './views/ConsultantView';
import { ExploreView } from './views/ExploreView';
import { MirrorView } from './views/MirrorView';
import { ProfileView } from './views/ProfileView';

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.INTRO);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const initSession = async () => {
    try {
      const saved = loadUser();
      if (saved?.id) {
        const profile = await apiClient.getProfile(saved.id);
        const syncedUser: User = {
          id: saved.id,
          username: profile.username,
          isVerified: true,
          joinDate: profile.created_at,
          lastLogin: Date.now(),
          stats: profile.stats,
          tasks: profile.tasks || [],
          inventory: profile.inventory || [],
          manifesto: profile.manifesto,
          originStory: profile.origin_story,
          avatarUrl: profile.avatar_url,
          coverUrl: profile.cover_url,
          entropy: profile.entropy || 0,
          following: profile.following || []
        };
        setCurrentUser(syncedUser);
        saveUser(syncedUser);
        setView(ViewState.SANCTUM);
      }
    } catch (error) {
      console.log('No session found');
    }
  };

  useEffect(() => { initSession(); }, []);

  const handleUpdateUser = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    saveUser(updatedUser);
    if (updatedUser.id) {
      try {
        await apiClient.updateProfile(updatedUser.id, {
          stats: updatedUser.stats,
          tasks: updatedUser.tasks,
          inventory: updatedUser.inventory,
          avatarUrl: updatedUser.avatarUrl,
          coverUrl: updatedUser.coverUrl,
          entropy: updatedUser.entropy,
          following: updatedUser.following
        });
      } catch (error) {
        console.error('Profile update failed:', error);
      }
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setView(ViewState.SANCTUM);
  };

  const handleLogout = () => {
    clearUser();
    setCurrentUser(null);
    setView(ViewState.AUTH_CHOICE);
  };

  switch (view) {
    case ViewState.INTRO: return <IntroView onFinish={() => setView(ViewState.AUTH_CHOICE)} />;
    case ViewState.AUTH_CHOICE: return <AuthChoiceView onChoice={c => setView(c === 'CREATE' ? ViewState.CREATE_IDENTITY : ViewState.EMBARK)} />;
    case ViewState.CREATE_IDENTITY: return <CreateIdentityView onComplete={handleLoginSuccess} onBack={() => setView(ViewState.AUTH_CHOICE)} />;
    case ViewState.EMBARK: return <EmbarkView onComplete={handleLoginSuccess} onBack={() => setView(ViewState.AUTH_CHOICE)} />;
    
    default:
      if (!currentUser) return <div className="h-screen bg-void flex items-center justify-center animate-pulse text-gold uppercase font-black">Syncing...</div>;
      return (
        <div className="font-sans text-slate-200 bg-void min-h-screen selection:bg-gold selection:text-black safe-pb">
          {view === ViewState.SANCTUM && <SanctumView />}
          {view === ViewState.EXPLORE && <ExploreView />}
          {view === ViewState.HIERARCHY && <HierarchyView />}
          {view === ViewState.ORACLE && <ConsultantView />}
          {view === ViewState.MIRROR && <MirrorView user={currentUser} onUpdateUser={handleUpdateUser} />}
          {view === ViewState.SYSTEM && <SystemView user={currentUser} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />}
          {view === ViewState.PROFILE && <ProfileView currentUser={currentUser} onUpdateUser={handleUpdateUser} onBack={() => setView(ViewState.SANCTUM)} />}
          <NavBar current={view} setView={setView} />
        </div>
      );
  }
}
