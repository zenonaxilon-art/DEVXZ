import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, Filter, ShoppingCart, User as UserIcon, Gamepad2 } from 'lucide-react';

export const Home = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { session } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          users!products_seller_id_fkey (
            username,
            avatar,
            verified
          )
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.textSearch('search_vector', searchQuery);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (productId: string, sellerId: string) => {
    if (!session) {
      alert("Please login first to buy products");
      return;
    }
    if (session.user.id === sellerId) {
      alert("You cannot buy your own product!");
      return;
    }
    
    try {
      const { error } = await supabase.from('orders').insert({
        buyer_id: session.user.id,
        product_id: productId,
        status: 'pending'
      });
      if (error) throw error;
      alert("Order placed successfully!");
    } catch (error: any) {
      alert("Failed to place order: " + error.message);
    }
  };

  return (
    <div className="bg-[#080808] flex-1 text-[#E5E5E5] pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-serif italic mb-1">Marketplace</h2>
            <p className="text-xs opacity-50 uppercase tracking-widest">Vetted professional developer assets</p>
          </div>
          
          <div className="flex w-full md:w-auto items-center space-x-2">
            <div className="relative flex-1 md:w-80">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A1A] border border-[#262626] rounded-full py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:border-white/20 transition"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
            </div>
            <button className="bg-[#1A1A1A] border border-[#262626] p-1.5 rounded-full hover:bg-[#262626] transition">
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1A1A] rounded-sm border border-[#262626]">
            <ShoppingCart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-[#E5E5E5]">No products found</h3>
            <p className="text-gray-500 mt-2 text-sm">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-[#111] border border-[#262626] overflow-hidden rounded-sm group flex flex-col">
                <div className="h-40 bg-[#1A1A1A] relative flex items-center justify-center">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 bg-[#222] border border-white/5 rounded rotate-12 flex items-center justify-center text-[10px] opacity-40">
                      ASSET
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#D4AF37] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                    R$ {product.price}
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-sm font-medium leading-tight mb-2 truncate" title={product.title}>{product.title}</h4>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 rounded-full bg-[#333] flex items-center justify-center overflow-hidden">
                      {product.users?.avatar ? (
                        <img src={product.users.avatar} alt={product.users.username} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-3 h-3 text-gray-500" />
                      )}
                    </div>
                    <span className="text-[10px] opacity-40 uppercase tracking-wider truncate max-w-[100px]" title={product.users?.username}>
                      {product.users?.username || 'Unknown'}
                      {product.users?.verified && <span className="text-[#D4AF37] ml-1" title="Verified Developer">âœ“</span>}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] opacity-30 flex-1 truncate mr-2" title={product.description}>{product.description}</span>
                    <button 
                      onClick={() => handleBuy(product.id, product.seller_id)}
                      className="text-[10px] font-bold border-b border-white hover:border-transparent transition-all whitespace-nowrap"
                    >
                      BUY NOW
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
