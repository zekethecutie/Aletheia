import React, { useState } from 'react';
import { IconX } from '../Icons';
import { apiClient } from '../../services/apiClient';

interface ReportModalProps {
  targetUserId?: string;
  targetPostId?: number;
  reporterId: string;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ targetUserId, targetPostId, reporterId, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await apiClient.reportPost(
        reporterId,
        targetUserId || "",
        targetPostId || 0,
        reason
      );
      alert('Report transmitted to the High Arbiter. The void will judge.');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to transmit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-6 backdrop-blur-md">
      <div className="bg-slate-950 w-full max-w-md p-6 border border-slate-800 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><IconX className="w-6 h-6" /></button>
        <h2 className="text-xl text-white font-black uppercase mb-6 tracking-tight">Report Signal</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full h-32 bg-slate-900 border border-slate-800 p-4 text-white text-sm outline-none focus:border-red-500 mb-6"
          placeholder="Specify the violation of universal laws..."
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 bg-red-600 text-white uppercase font-black text-xs tracking-widest hover:bg-red-700 transition-colors"
        >
          {loading ? 'Transmitting...' : 'Issue Report'}
        </button>
      </div>
    </div>
  );
};