import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Store, ShieldCheck, Gamepad2 } from 'lucide-react';

export const Navbar = () => {
  const { session, profile, signOut } = useAuth();

  return (
    <nav className="bg-[#0D0D0D] border-b border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Gamepad2 className="w-8 h-8 text-white opacity-90" />
              <div className="text-2xl font-serif italic tracking-tighter text-white">RBX<span className="text-[#F2F2F2] opacity-50">.DEV</span></div>
            </Link>
            
            <div className="hidden md:block">
              <div className="flex space-x-1">
                <Link to="/" className="text-xs uppercase tracking-[0.2em] font-medium opacity-60 hover:text-white hover:opacity-100 transition-colors px-3 py-2">
                  Marketplace
                </Link>
                {session && (
                  <>
                    <Link to="/messages" className="text-xs uppercase tracking-[0.2em] font-medium opacity-60 hover:text-white hover:opacity-100 transition-colors px-3 py-2">
                      Messages
                    </Link>
                    <Link to="/create" className="text-xs uppercase tracking-[0.2em] font-medium opacity-60 hover:text-white hover:opacity-100 transition-colors px-3 py-2">
                      Create Listing
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {profile?.role === 'admin' && (
              <Link to="/admin" className="text-red-400 hover:text-red-300 px-3 py-2 text-[10px] uppercase tracking-widest font-bold transition flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1" />
                Admin Panel
              </Link>
            )}
            
            {session ? (
              <div className="flex items-center space-x-4 border-l border-[#262626] pl-6">
                <Link to="/verify" className="bg-[#D4AF37] hover:opacity-80 text-black px-4 py-2 rounded-md text-[10px] uppercase tracking-widest font-bold transition">
                  {profile?.verified ? 'âœ“ Verified Dev' : 'Get Verified'}
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-white">{profile?.username}</span>
                    {profile?.verified && <span className="text-[10px] text-[#D4AF37] tracking-widest uppercase font-semibold">Verified Developer</span>}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#222] to-[#444] border border-[#D4AF37] p-0.5">
                    <div className="w-full h-full rounded-full bg-[#0A0A0A] overflow-hidden flex items-center justify-center">
                      {profile?.avatar ? (
                        <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="text-gray-400 hover:text-white transition ml-2"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-3 border-l border-[#262626] pl-6">
                <Link to="/login" className="bg-white hover:bg-gray-200 text-black px-4 py-2 rounded-md text-[10px] uppercase tracking-widest font-bold transition">
                  Log In
                </Link>
                <Link to="/signup" className="text-white hover:opacity-80 px-4 py-2 rounded-md text-[10px] uppercase tracking-widest font-bold border border-[#262626] transition">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
