import React, { useState } from 'react';
import { IconX, IconFeather } from '../Icons';

interface CreatePostModalProps {
  onClose: () => void;
  onSubmit: (content: string) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      onSubmit(content);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 animate-fade-in backdrop-blur-xl">
       <div className="bg-gradient-to-br from-slate-950 to-slate-900 w-full max-w-lg p-1 rounded-lg shadow-2xl relative overflow-hidden transform transition-all animate-fade-in-up">
          {/* Animated Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/30 to-transparent animate-pulse-slow"></div>
          
          <div className="bg-slate-950 p-6 relative rounded-md">
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-transform hover:rotate-90"><IconX className="w-6 h-6" /></button>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-slate-900 rounded-full border border-slate-800 text-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    <IconFeather className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl text-white font-black uppercase tracking-tight">Broadcast Signal</h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Inject Truth into the Void</p>
                </div>
            </div>
            
            <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)}
                className="w-full h-48 bg-slate-900/50 border border-slate-800 p-4 text-white font-serif text-lg focus:border-gold outline-none resize-none mb-6 placeholder-slate-700 transition-colors rounded-sm shadow-inner"
                placeholder="The silence is waiting..."
            />
            
            <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">{content.length} chars</span>
                <button 
                    onClick={handleSubmit} 
                    disabled={!content.trim()} 
                    className="px-8 py-3 bg-white text-black uppercase font-black text-xs tracking-[0.2em] hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                    Transmit
                </button>
            </div>
          </div>
       </div>
    </div>
  );
};
