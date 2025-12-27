import React from 'react';
import { IconX } from './Icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, rightAction }) => (
  <div className="pt-12 pb-4 px-6 sticky top-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-between border-b border-slate-900/50">
    <div className="flex items-center gap-4">
      {onBack && (
        <button onClick={onBack} className="p-1 hover:bg-slate-800 rounded transition-colors">
          <IconX className="w-6 h-6 text-white" />
        </button>
      )}
      <div>
        <h1 className="text-3xl font-sans font-black text-white uppercase tracking-tighter leading-none">{title}</h1>
        {subtitle && <p className="text-gold text-[10px] mt-1 font-bold uppercase tracking-[0.2em]">{subtitle}</p>}
      </div>
    </div>
    {rightAction}
  </div>
);
