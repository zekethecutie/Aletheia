import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { IconX, IconUser } from '../Icons';
import { readFileAsDataURL } from '../../utils/helpers';
import { supabase } from '../../services/supabaseClient';
import { apiClient } from '../../services/apiClient';

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (u: User) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUpdate }) => {
  const [avatar, setAvatar] = useState(user.avatarUrl || '');
  const [cover, setCover] = useState(user.coverUrl || '');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
     if (e.target.files && e.target.files[0]) {
        try {
           const file = e.target.files[0];
           
           // Check if bucket exists, if not we fall back to base64 for now to avoid blocking user
           // but we try the upload first.
           const fileName = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
           
           const { data, error } = await supabase.storage
             .from('profiles')
             .upload(fileName, file, { 
               upsert: true,
               contentType: file.type 
             });
             
           if (error) {
             console.warn('Storage upload failed, falling back to local preview:', error);
             const base64 = await readFileAsDataURL(file);
             setter(base64);
             return;
           }
           
           const { data: { publicUrl } } = supabase.storage
             .from('profiles')
             .getPublicUrl(fileName);
             
           setter(publicUrl);
        } catch(err) { 
           console.error('File processing error:', err);
           const file = e.target.files?.[0];
           if (file) {
             const base64 = await readFileAsDataURL(file);
             setter(base64);
           }
        }
     }
  };

  const handleSave = async () => {
    try {
      // 1. Update Profile via API - ensuring it saves to DB
      const updatedProfile = await apiClient.updateProfile(user.id, { 
          avatarUrl: avatar, 
          coverUrl: cover 
      });
      
      // 2. Update local state with whatever came back from DB
      onUpdate({ 
        ...user, 
        avatarUrl: updatedProfile.avatar_url || avatar, 
        coverUrl: updatedProfile.cover_url || cover 
      });
      
      onClose();
    } catch (err) {
      console.error('Save settings error:', err);
      // Fallback update if API fails but we want local persistence for this session
      onUpdate({ ...user, avatarUrl: avatar, coverUrl: cover });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6 animate-fade-in backdrop-blur-md">
       <div className="bg-slate-950 w-full max-w-md p-6 border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><IconX className="w-6 h-6" /></button>
          <h2 className="text-xl text-white font-black uppercase mb-6 tracking-tight">Signal Configuration</h2>
          
          <div className="space-y-6 mb-8">
             <div>
               <label className="text-xs text-slate-500 uppercase font-bold block mb-2 tracking-widest">Avatar Image</label>
               <div className="flex items-center gap-4">
                 <div className="w-16 h-16 bg-black border border-slate-800 rounded-full overflow-hidden flex-shrink-0">
                    {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><IconUser className="w-6 h-6"/></div>}
                 </div>
                 <div className="flex-1">
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar)} />
                    <button onClick={() => avatarInputRef.current?.click()} className="px-4 py-2 bg-slate-900 border border-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-800 transition-colors">Upload File</button>
                 </div>
               </div>
             </div>
             
             <div>
               <label className="text-xs text-slate-500 uppercase font-bold block mb-2 tracking-widest">Cover Frequency</label>
               <div className="w-full h-24 bg-black border border-slate-800 overflow-hidden mb-2 relative group">
                  {cover ? <img src={cover} className="w-full h-full object-cover opacity-50" /> : <div className="w-full h-full flex items-center justify-center text-slate-700 text-[10px] uppercase">No Signal</div>}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-white text-[10px] uppercase font-bold">Preview</span>
                  </div>
               </div>
               <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setCover)} />
               <button onClick={() => coverInputRef.current?.click()} className="w-full py-3 bg-slate-900 border border-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-800 transition-colors">Upload Cover</button>
             </div>
          </div>
          
          <button onClick={handleSave} className="w-full py-4 bg-white text-black uppercase font-black text-xs tracking-widest hover:bg-slate-200 transition-colors">Update Identity</button>
       </div>
    </div>
  );
};