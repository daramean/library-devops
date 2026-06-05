import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
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
      // Extract error message from different possible locations
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg">OBITO STORE</span>
        </div>
        <h2 className="font-display text-3xl font-bold mb-1">Create account</h2>
        <p className="text-gray-500 mb-8">Join OBITO STORE to start borrowing books</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['Full Name','full_name','text'],['Email','email','email'],['Phone','phone','tel'],['Password','password','password']].map(([label, name, type]) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input type={type} className="input" required={name !== 'phone'}
                value={form[name]} onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))} />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <Link to="/login" className="text-brand-500 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
