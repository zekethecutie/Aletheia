import React from 'react';
import { Notification } from '../types';
import { formatTime } from '../utils/helpers';

export const NotificationCenter: React.FC<{ 
  notifications: Notification[]; 
  onClose: () => void;
  onMarkRead: (id: number) => void;
}> = ({ notifications, onClose, onMarkRead }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>
      <div className="w-full max-w-sm bg-slate-950 border border-white/10 rounded-3xl shadow-2xl pointer-events-auto overflow-hidden animate-slide-in-right">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Directives & Resonance</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-[10px] uppercase text-slate-600 tracking-widest italic">The void is silent.</div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => onMarkRead(n.id)}
                className={`p-6 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer relative ${!n.is_read ? 'bg-blue-500/5' : ''}`}
              >
                {!n.is_read && <div className="absolute top-6 left-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                <div className="flex gap-4">
                  {n.sender_avatar ? (
                    <img src={n.sender_avatar} className="w-8 h-8 rounded-lg border border-white/10" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-[10px]">👁️</div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <span className="font-black text-white uppercase text-[9px] tracking-widest mr-2">{n.sender_username || 'SYSTEM'}</span>
                      {n.type === 'RESONANCE' && 'found resonance in your transmission.'}
                      {n.type === 'FOLLOW' && 'is now tracking your frequency.'}
                      {n.type === 'SYSTEM_WARN' && <span className="text-amber-400">issued a directive: {n.content}</span>}
                    </p>
                    <p className="text-[7px] uppercase font-mono text-slate-600 mt-2">{formatTime(new Date(n.created_at).getTime())}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
