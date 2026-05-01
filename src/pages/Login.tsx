import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, AlertCircle } from 'lucide-react';

// Roblox OAuth login handler inside the component
export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();
  
  // To handle redirect back after login
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, navigate, from]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleRobloxLogin = async () => {
    try {
      const res = await fetch('/api/auth/roblox/url');
      if (!res.ok) throw new Error('Failed to fetch Roblox auth URL');
      const { url } = await res.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) setError('Please allow popups for Roblox login');

      const handleMessage = (event: MessageEvent) => {
        if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
          // Typically we would fetch session via supabase here, but this is a placeholder
          // for the actual backend logic which creates the token.
          window.location.reload();
        }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate Roblox login');
    }
  };

  return (
    <div className="flex-1 bg-[#0A0A0A] flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 pt-16">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Gamepad2 className="mx-auto h-12 w-12 text-white opacity-90" />
        <h2 className="mt-6 text-3xl font-serif italic text-[#E5E5E5]">Sign in to your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111] py-8 px-4 shadow sm:rounded-sm sm:px-10 border border-[#262626]">
          {error && (
            <div className="mb-4 bg-red-900/50 border border-red-500 rounded p-3 flex items-start text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-300" htmlFor="email">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#262626] rounded-sm bg-[#1A1A1A] text-[#E5E5E5] placeholder-gray-500 focus:outline-none focus:border-white/20 sm:text-xs transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300" htmlFor="password">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-[#262626] rounded-sm bg-[#1A1A1A] text-[#E5E5E5] placeholder-gray-500 focus:outline-none focus:border-white/20 sm:text-xs transition"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-sm text-[10px] uppercase tracking-widest font-bold text-black bg-[#D4AF37] hover:opacity-80 focus:outline-none disabled:opacity-50 transition"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#262626]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#111] text-[9px] uppercase tracking-widest text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleRobloxLogin}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-[#262626] rounded-sm bg-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold text-[#E5E5E5] hover:bg-[#222] transition"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_black.svg" className="w-4 h-4 mr-2 invert filter opacity-90" alt="Roblox" />
                Sign in with Roblox
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-white hover:opacity-80 transition border-b border-white">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
