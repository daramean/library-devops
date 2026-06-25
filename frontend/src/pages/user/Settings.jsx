import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../context/AuthContext';

export default function UserSettings() {
  const { user, logout } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: passwordForm.old_password,
        newPassword: passwordForm.new_password,
        passwordConfirm: passwordForm.confirm_password,
      });

      toast.success('Password changed successfully');
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-[16px] p-8 shadow-sm border border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-6">My Profile</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Full Name</label>
            <div className="px-4 py-3 bg-gray-50 rounded-[10px] text-gray-900 font-medium">{user?.full_name || '—'}</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Email Address</label>
            <div className="px-4 py-3 bg-gray-50 rounded-[10px] text-gray-900 font-medium">{user?.email || '—'}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Role</label>
              <div className="px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold capitalize inline-block">
                {user?.role || '—'}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Member Since</label>
              <div className="text-sm text-gray-900 font-medium">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-[16px] p-8 shadow-sm border border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-6">Security</h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Current Password</label>
            <input
              type="password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              placeholder="Enter your current password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:bg-white focus:border-brand-500 focus:outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">New Password</label>
            <input
              type="password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              placeholder="Enter a new password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:bg-white focus:border-brand-500 focus:outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Confirm Password</label>
            <input
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              placeholder="Confirm your new password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-[10px] focus:bg-white focus:border-brand-500 focus:outline-none transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-[10px] transition"
          >
            {changingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-[16px] p-8 shadow-sm border border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-3 rounded-[10px] text-red-600 hover:bg-red-50 transition font-medium"
        >
          <LogOut size={18}/>
          Sign Out
        </button>
      </div>
    </div>
  );
}
