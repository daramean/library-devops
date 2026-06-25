import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, BookMarked, Users, Shield } from 'lucide-react';
import { api } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      setEmail('');
      toast.success('Check your email for password reset instructions');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
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

          {!submitted ? (
            <>
              {/* Header */}
              <h2 className="text-4xl font-bold text-gray-900 mb-3">Reset password</h2>
              <p className="text-gray-600 mb-8">Enter your email to receive a password reset link</p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@library.com"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-semibold py-3 rounded-full transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                    </>
                  )}
                </button>
              </form>

              {/* Links */}
              <div className="border-t border-gray-200 mt-8 pt-6 space-y-3 text-center">
                <p className="text-gray-600 text-sm">
                  Remember your password?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                    Sign in
                  </Link>
                </p>
                <p className="text-gray-600 text-sm">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                    Create one
                  </Link>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center space-y-4 animate-fade-in">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
                <p className="text-gray-600 text-sm">
                  We've sent a password reset link to <span className="font-semibold">{email}</span>. Check your inbox and click the link to reset your password.
                </p>
                <p className="text-gray-400 text-xs">
                  The link will expire in 1 hour. Check your spam folder if you don't see it.
                </p>

                {/* Action Buttons */}
                <div className="space-y-3 pt-6">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setEmail('');
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-full transition shadow-lg hover:shadow-xl"
                  >
                    Try Another Email
                  </button>
                  <Link
                    to="/login"
                    className="w-full block text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-full transition"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
