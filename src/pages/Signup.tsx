import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Gamepad2, AlertCircle } from 'lucide-react';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [username, setUsername] = useState(''); // We use email as username in our trigger by default or ask the user. Let's ask!
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      // If auto confirm is off, we might have session=null but user=something.
      if (data.session) {
        navigate('/');
      } else {
        setError('Check your email for the confirmation link');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0A0A0A] flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 pt-16">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Gamepad2 className="mx-auto h-12 w-12 text-white opacity-90" />
        <h2 className="mt-6 text-3xl font-serif italic text-[#E5E5E5]">Create your account</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111] py-8 px-4 shadow sm:rounded-sm sm:px-10 border border-[#262626]">
          {error && (
            <div className="mb-4 bg-red-900/50 border border-red-500 rounded p-3 flex items-start text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSignup}>
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
                {loading ? 'Signing up...' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-white hover:opacity-80 transition border-b border-white">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
