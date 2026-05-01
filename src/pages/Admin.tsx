import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Check, X, AlertCircle } from 'lucide-react';

export const AdminPanel = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          users (
            username,
            avatar,
            verified
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, userId: string, action: 'approved' | 'rejected') => {
    let notes = '';
    if (action === 'rejected') {
      notes = prompt("Reason for rejection?") || "Failed to verify proof of purchase.";
    }

    try {
      // 1. Update Request Status
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({ status: action, admin_notes: notes })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // 2. If approved, update user's verified status
      if (action === 'approved') {
        const { error: userError } = await supabase
          .from('users')
          .update({ verified: true })
          .eq('id', userId);
        
        if (userError) throw userError;
      }

      // 3. Remove from UI
      setRequests(reqs => reqs.filter(r => r.id !== requestId));
      alert(`Request ${action} successfully.`);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 flex-1 w-full">
      <div className="flex items-center mb-8 pb-4 border-b border-[#262626]">
        <ShieldCheck className="w-8 h-8 text-red-500 mr-3" />
        <h1 className="text-3xl font-serif italic text-white flex-1">Admin Dashboard</h1>
      </div>

      <div className="mb-12">
        <h2 className="text-xl font-bold text-gray-500 mb-6 uppercase tracking-widest text-xs">Pending Verifications</h2>
        
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="bg-[#111] border border-[#262626] rounded-sm p-8 text-center text-gray-500 text-sm">
            No pending verification requests.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map(req => (
              <div key={req.id} className="bg-[#111] border border-[#262626] rounded-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[#262626] flex items-center justify-between bg-[#1A1A1A]">
                  <div className="flex items-center space-x-3">
                    <img src={req.users?.avatar || ''} alt="avatar" className="w-8 h-8 rounded-full border border-[#D4AF37]" />
                    <div>
                      <div className="text-white font-medium text-xs">{req.users?.username}</div>
                      <div className="text-[10px] text-gray-500">{new Date(req.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  {req.users?.verified && <span className="text-[9px] bg-green-900/50 text-green-400 px-2 py-1 rounded-sm uppercase tracking-widest">Already Verified</span>}
                </div>
                
                <div className="p-4 flex-1">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest">Proof Image:</p>
                  <a href={req.proof_image_url} target="_blank" rel="noopener noreferrer">
                    <img 
                      src={req.proof_image_url} 
                      alt="Proof" 
                      className="w-full h-48 object-cover rounded-sm border border-[#262626] hover:opacity-80 transition cursor-pointer"
                    />
                  </a>
                </div>
                
                <div className="p-4 border-t border-[#262626] flex gap-3">
                  <button 
                    onClick={() => handleAction(req.id, req.user_id, 'approved')}
                    className="flex-1 bg-green-600/20 text-green-500 border border-green-500/50 hover:bg-green-600/30 font-bold py-2.5 px-4 rounded-sm flex items-center justify-center transition uppercase text-[10px] tracking-widest"
                  >
                    <Check className="w-3 h-3 mr-2" /> Approve
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, req.user_id, 'rejected')}
                    className="flex-1 bg-red-600/20 text-red-500 border border-red-500/50 hover:bg-red-600/30 font-bold py-2.5 px-4 rounded-sm flex items-center justify-center transition uppercase text-[10px] tracking-widest"
                  >
                    <X className="w-3 h-3 mr-2" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
