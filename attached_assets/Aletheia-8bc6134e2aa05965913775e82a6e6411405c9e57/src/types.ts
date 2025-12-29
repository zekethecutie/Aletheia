
export enum ViewState {
  INTRO = 'INTRO',
  AUTH_CHOICE = 'AUTH_CHOICE',
  CREATE_IDENTITY = 'CREATE_IDENTITY',
  EMBARK = 'EMBARK',
  SANCTUM = 'SANCTUM',
  EXPLORE = 'EXPLORE',
  HIERARCHY = 'HIERARCHY',
  MIRROR = 'MIRROR',
  ORACLE = 'ORACLE',
  PROFILE = 'PROFILE',
  SYSTEM = 'SYSTEM',
  VIEW_PROFILE = 'VIEW_PROFILE'
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  intelligence: number;
  physical: number;
  spiritual: number;
  wealth: number;   
  social: number;
  resonance: number;
  maxResonance: number;
  health: number;
  maxHealth: number;
  class: string;
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY' | 'MYTHIC';
  effect: string; 
  icon: string; 
  imageUrl?: string; 
  color?: string; 
  dateAcquired: number;
  creatorId?: string; 
}

export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  type: 'DAILY' | 'HABIT'; 
  streak?: number;
  difficulty?: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
}

export interface User {
  id: string; 
  username: string;
  isVerified: boolean;
  joinDate: string;
  lastLogin: number;
  stats: UserStats;
  tasks: DailyTask[];
  inventory: Artifact[]; 
  manifesto?: string;
  originStory?: string; 
  following: string[]; 
  followersCount?: number; 
  entropy?: number; 
  rank?: string; 
  title?: string; 
  avatarUrl?: string;
  coverUrl?: string;
  goals?: string[];
}

export interface Notification {
  id: number;
  user_id: string;
  type: 'RESONANCE' | 'FOLLOW' | 'SYSTEM_WARN' | 'SYSTEM_BAN';
  sender_id?: string;
  sender_username?: string;
  sender_avatar?: string;
  post_id?: number;
  content?: string;
  is_read: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  timestamp: number;
  parent_id?: number;
  replies: Comment[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorCover?: string; 
  authorClass?: string; 
  content: string;
  resonance: number; 
  likedBy: string[]; 
  timestamp: number;
  tags: string[];
  comments: Comment[];
  commentCount: number;
  isSystemPost?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface DailyQuote {
  text: string;
  author: string; 
  date: string;
}

export interface FeatResponse {
  xpGained: number;
  statsIncreased: Partial<UserStats>;
  systemMessage: string;
}

export interface SearchResult {
  type: 'USER' | 'POST';
  title: string;
  subtitle: string;
  content?: string;
  id: string;
  avatar?: string;
}

export interface MirrorScenario {
  situation: string;
  choiceA: string;
  choiceB: string;
  testedStat: string;
}

export interface MirrorResult {
  outcome: string;
  statChange?: Record<string, number>;
  rewardType?: 'ARTIFACT' | 'STAT_ONLY';
  reward?: Artifact;
}
