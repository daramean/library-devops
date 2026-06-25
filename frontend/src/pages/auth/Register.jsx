import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, BookMarked, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex relative bg-white">
      {/* Left Panel with Background Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-cover bg-center bg-no-repeat flex-col justify-between p-12 relative overflow-hidden" style={{ backgroundImage: 'url(/images/library-desk.jpg)' }}>
        {/* Subtle overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

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

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src="/images/logo.png" alt="OBITO STORE" className="w-14 h-14 rounded-lg shadow-lg" />
            <span className="font-bold text-xl text-gray-900">OBITO STORE</span>
          </div>

          {/* Header */}
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Create account</h2>
          <p className="text-gray-600 mb-8">Join OBITO STORE to start borrowing books</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                placeholder="John Doe"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Phone (Optional)</label>
              <input
                type="tel"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 rounded-full transition shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  {' '}Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-gray-700 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
