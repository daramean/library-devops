import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff, ArrowRight, BookMarked, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.full_name}!`);
      navigate(user.role === 'admin' || user.role === 'librarian' ? '/admin' : '/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Invalid credentials. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat flex-col justify-between p-12 relative overflow-hidden" style={{ backgroundImage: 'url(/images/library-desk.jpg)' }}>
        {/* Subtle overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        
        {/* Illustration Section - hidden, replaced with background image */}
        <div className="absolute bottom-0 right-0 w-full h-3/4 opacity-0 pointer-events-none">
          <div></div>
        </div>

        {/* Warm ambient glow */}
        <div className="absolute bottom-24 right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-full h-48 bg-gradient-to-t from-amber-600/20 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative z-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <img src="/images/logo.png" alt="OBITO STORE" className="w-14 h-14 rounded-lg shadow-lg" />
            <span className="font-bold text-xl text-white tracking-tight">OBITO STORE</span>
          </div>

          {/* Heading */}
          <h1 className="font-bold text-6xl leading-tight mb-6">
            <span className="text-white">Your library,</span><br />
            <span className="bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">always</span>
            <span className="text-white"> open.</span>
          </h1>
          <p className="text-gray-300 text-lg mb-12">
            Manage books, borrows and returns with a modern system.
          </p>
        </div>

        {/* Stats - with better styling */}
        <div className="relative z-20 grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-900/60 to-blue-950/60 backdrop-blur-sm border border-blue-700/60 rounded-xl p-5 hover:from-blue-900/80 hover:to-blue-950/80 transition">
            <BookMarked size={24} className="text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-blue-300">10K+</div>
            <div className="text-gray-400 text-sm mt-1">Books</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/60 to-blue-950/60 backdrop-blur-sm border border-blue-700/60 rounded-xl p-5 hover:from-blue-900/80 hover:to-blue-950/80 transition">
            <Users size={24} className="text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-blue-300">500+</div>
            <div className="text-gray-400 text-sm mt-1">Members</div>
          </div>
          <div className="bg-gradient-to-br from-blue-900/60 to-blue-950/60 backdrop-blur-sm border border-blue-700/60 rounded-xl p-5 hover:from-blue-900/80 hover:to-blue-950/80 transition">
            <Shield size={24} className="text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-blue-300">99.9%</div>
            <div className="text-gray-400 text-sm mt-1">Uptime</div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/images/logo.png" alt="OBITO STORE" className="w-14 h-14 rounded-lg shadow-lg" />
            <span className="font-bold text-xl text-gray-900">OBITO STORE</span>
          </div>

          {/* Header */}
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Welcome back</h2>
          <p className="text-gray-600 mb-8">Sign in to continue to your account.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="admin@library.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 border border-gray-300 rounded accent-blue-600"
                />
                <span className="text-sm text-gray-700 font-medium">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 rounded-full transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg bg-white hover:bg-gray-50 transition font-medium text-gray-700"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Register Link */}
          <p className="text-center text-sm text-gray-700 mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
