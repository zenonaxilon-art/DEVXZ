import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, X } from 'lucide-react';

export const CreateListing = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('models');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray].slice(0, 4)); // Max 4 images
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    
    setLoading(true);
    setError('');

    try {
      const uploadedImageUrls: string[] = [];
      
      // Upload images first
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
        const filePath = `products/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
          
        uploadedImageUrls.push(publicUrl);
      }

      // Create product record
      const { error: dbError } = await supabase
        .from('products')
        .insert({
          title,
          description,
          price: parseFloat(price),
          category,
          images: uploadedImageUrls,
          seller_id: session.user.id
        });

      if (dbError) throw dbError;

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 flex-1 w-full">
      <div className="bg-[#111] border border-[#262626] rounded-sm p-8">
        <h1 className="text-2xl font-serif italic text-white mb-6">Create New Listing</h1>
        
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500 rounded p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase font-medium text-gray-500 tracking-widest mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#262626] rounded-sm px-4 py-2 text-[#E5E5E5] focus:outline-none focus:border-white/20 transition text-sm"
              placeholder="e.g. Low Poly Weapons Pack"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-medium text-gray-500 tracking-widest mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#262626] rounded-sm px-4 py-2 text-[#E5E5E5] focus:outline-none focus:border-white/20 transition text-sm"
              placeholder="Describe your asset in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-medium text-gray-500 tracking-widest mb-1">Price (Robux R$)</label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-sm px-4 py-2 text-[#E5E5E5] focus:outline-none focus:border-white/20 transition text-sm"
                placeholder="amount"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-medium text-gray-500 tracking-widest mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-sm px-4 py-2 text-[#E5E5E5] focus:outline-none focus:border-white/20 transition text-sm"
              >
                <option value="models">3D Models</option>
                <option value="scripts">Scripts</option>
                <option value="audio">Audio / SFX</option>
                <option value="ui">UI Components</option>
                <option value="plugins">Plugins</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-medium text-gray-500 tracking-widest mb-2">Images (Max 4)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video bg-[#1A1A1A] rounded-sm overflow-hidden border border-[#262626]">
                  <img src={URL.createObjectURL(img)} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 bg-[#111] border border-[#262626] text-white rounded-full p-1 hover:bg-[#222] transition"
                  >
                    <X className="w-3 h-3 text-[#D4AF37]" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <label className="aspect-video flex flex-col items-center justify-center border border-dashed border-[#262626] rounded-sm cursor-pointer hover:border-white/20 hover:bg-[#1A1A1A] transition">
                  <Upload className="w-6 h-6 text-gray-500 mb-1" />
                  <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Add Image</span>
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                </label>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-[#262626]">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:opacity-80 text-black px-6 py-3 rounded-sm font-bold uppercase tracking-widest text-[10px] transition disabled:opacity-50"
            >
              {loading ? 'Creating Listing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
