import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
      // Extract error message from different possible locations
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
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-950 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <span className="font-display text-xl font-bold">OBITO STORE</span>
        </div>
        <div>
          <h1 className="font-display text-5xl font-bold leading-tight mb-4">
            Your library,<br />always open.
          </h1>
          <p className="text-gray-400 text-lg">
            Manage books, borrows and returns with a modern system.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[['10K+','Books'],['500+','Members'],['99.9%','Uptime']].map(([n,l]) => (
            <div key={l} className="card bg-gray-900 border-gray-800 p-4">
              <div className="font-display text-2xl font-bold text-brand-500">{n}</div>
              <div className="text-gray-400 text-sm">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg">OBITO STORE</span>
          </div>
          
          <h2 className="font-display text-3xl font-bold mb-1">Sign in</h2>
          <p className="text-gray-500 mb-8">Welcome back — enter your credentials</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required
                  className="input pl-9"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'} required
                  className="input pl-9 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 hover:underline font-medium">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
