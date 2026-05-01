import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ExternalLink, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export const Verify = () => {
  const { session, profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // 400 Robux Gamepass URL (Replace with actual ID later)
  const GAMEPASS_URL = "https://www.roblox.com/game-pass/12345/VIP-Gamepass";

  useEffect(() => {
    checkStatus();
  }, [session]);

  const checkStatus = async () => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setStatus(data.status);
        setAdminNotes(data.admin_notes || '');
      }
    } catch (err) {
      console.error("Error checking verification status", err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !session) return;
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `verification_proofs/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('proofs') // Assuming a storage bucket named 'proofs'
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('proofs')
        .getPublicUrl(filePath);

      // 3. Create Verification Request Record
      const { error: dbError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: session.user.id,
          proof_image_url: publicUrl,
          status: 'pending'
        });

      if (dbError) throw dbError;

      setSuccess('Verification request submitted successfully. Please wait for admin approval.');
      setStatus('pending');
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload proof. Ensure the "proofs" bucket exists and allows uploads.');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.verified || status === 'approved') {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 flex-1 w-full">
        <div className="bg-[#111] border border-[#D4AF37] rounded-sm p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
          <CheckCircle className="w-16 h-16 text-[#D4AF37] mx-auto mb-6" />
          <h2 className="text-3xl font-serif italic text-white mb-2">Verified Developer</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">Your account has been officially verified. The verified badge is now displayed next to your username across the marketplace.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 flex-1 w-full">
      <h1 className="text-3xl font-serif italic text-white mb-8">Get Verified</h1>
      
      {status === 'pending' && (
        <div className="bg-[#111] border border-yellow-500/50 rounded-sm p-6 mb-8 text-center">
           <div className="animate-pulse bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/30">
             <AlertCircle className="w-8 h-8 text-yellow-500" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Verification Pending</h3>
           <p className="text-gray-400 text-sm">Your proof is currently being reviewed by our moderation team. Check back later.</p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="bg-[#111] border border-red-500/50 rounded-sm p-6 mb-8">
           <h3 className="text-xl font-bold text-red-500 mb-2 flex items-center">
             <AlertCircle className="w-5 h-5 mr-2" />
             Verification Rejected
           </h3>
           <p className="text-gray-400 text-sm mb-4">Your previous verification request was rejected.</p>
           {adminNotes && (
             <div className="bg-[#0A0A0A] p-4 rounded-sm text-sm text-gray-400 border border-[#262626]">
               <span className="font-bold text-red-400 block mb-1 uppercase tracking-widest text-[9px]">Admin Note</span> {adminNotes}
             </div>
           )}
           <p className="text-gray-500 mt-4 text-xs">You can submit a new proof below.</p>
        </div>
      )}

      {(status === 'idle' || status === 'rejected') && (
        <div className="space-y-8">
          <div className="bg-[#111] border border-[#262626] rounded-sm p-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="bg-[#D4AF37] text-black w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3 font-bold">1</span>
              Purchase the VIP Gamepass
            </h2>
            <p className="text-gray-400 mb-6 text-sm">To get verified, you must purchase our official VIP gamepass on Roblox. This costs 400 Robux and helps prevent spam.</p>
            <a 
              href={GAMEPASS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-2.5 bg-white text-black text-[10px] uppercase font-bold tracking-widest rounded-sm hover:opacity-80 transition"
            >
              Buy Gamepass <ExternalLink className="w-3 h-3 ml-2" />
            </a>
          </div>

          <div className="bg-[#232527] border border-[#393b3d] rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="bg-[#00a2ff] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm mr-3">2</span>
              Upload Proof of Purchase
            </h2>
            <p className="text-gray-400 mb-6">Take a screenshot of your Roblox inventory confirming you own the gamepass, or a receipt. Upload it below.</p>
            
            {error && <div className="mb-4 text-red-400 text-sm">{error}</div>}
            {success && <div className="mb-4 text-green-400 text-sm">{success}</div>}

            <form onSubmit={handleUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-[#1b1c1d] transition">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-blue-400 font-medium">Click to upload</span> or drag and drop
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                {file && <p className="text-sm text-gray-400 mt-2">Selected: {file.name}</p>}
              </div>
              
              <button
                type="submit"
                disabled={!file || loading}
                className="w-full sm:w-auto px-6 py-2 bg-[#00a2ff] text-white font-bold rounded hover:bg-[#008de6] disabled:opacity-50 transition"
              >
                {loading ? 'Uploading...' : 'Submit Proof'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
