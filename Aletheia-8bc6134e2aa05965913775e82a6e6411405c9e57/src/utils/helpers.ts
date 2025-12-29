
import { User } from '../types';

export const STORAGE_KEY = 'aletheia_user';

export const saveUser = (user: User) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const loadUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearUser = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const formatTime = (ms: number) => {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const getRank = (level: number): string => {
  if (level >= 100) return 'NATIONAL';
  if (level >= 80) return 'S';
  if (level >= 60) return 'A';
  if (level >= 40) return 'B';
  if (level >= 20) return 'C';
  if (level >= 10) return 'D';
  return 'E';
};

export const getRankColor = (rank: string): string => {
  switch(rank) {
    case 'NATIONAL': return 'text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)]';
    case 'S': return 'text-gold drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]';
    case 'A': return 'text-red-500';
    case 'B': return 'text-purple-500';
    case 'C': return 'text-green-500';
    default: return 'text-slate-500';
  }
};
