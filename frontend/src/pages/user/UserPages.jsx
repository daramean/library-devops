// ════════════════════════════════════════════════
//  user/Dashboard.jsx
// ════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { api, normalizeCoverUrl, useAuth } from '../../context/AuthContext';

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/dashboard/user').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-8 bg-gradient-to-br from-brand-50 to-transparent dark:from-brand-950/20">
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Welcome back</p>
              <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
                {user?.full_name ?? 'Library member'}
              </h1>
              <p className="mt-4 text-base text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                Here's a quick summary of your current borrow activity and recommendations.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card p-6 bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="flex items-center justify-between gap-4 h-full">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">Books Borrowed</p>
                <p className="mt-3 text-3xl font-bold">{stats?.activeBorrows?.length ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-white/15 p-4 backdrop-blur-sm">
                <BookOpen size={28} className="text-brand-100" />
              </div>
            </div>
          </div>
          
          <div className="card p-6">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Quick Status</p>
            <div className="mt-5 space-y-3">
              {[
                { label: 'Due Soon', value: stats?.dueSoon?.length ?? 0, color: 'from-amber-50 to-amber-50/50 dark:from-amber-950/20', icon: '⏰' },
                { label: 'Unpaid Fines', value: stats ? `$${parseFloat(stats.unpaidFines).toFixed(2)}` : '—', color: 'from-red-50 to-red-50/50 dark:from-red-950/20', icon: '💰' },
              ].map(item => (
                <div key={item.label} className={`bg-gradient-to-r ${item.color} rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between`}>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{item.label}</p>
                    <p className="mt-1.5 text-lg font-bold text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                  <span className="text-2xl">{item.icon}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen,       label: 'Active Borrows', value: stats?.activeBorrows?.length ?? '—', gradient: 'from-blue-500 to-blue-600', bg: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20' },
          { icon: Clock,          label: 'Total Borrowed',  value: stats?.totalBorrowed ?? '—',          gradient: 'from-green-500 to-green-600', bg: 'from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20' },
          { icon: AlertTriangle,  label: 'Due Soon',        value: stats?.dueSoon?.length ?? '—',        gradient: 'from-amber-500 to-amber-600', bg: 'from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20' },
          { icon: DollarSign,     label: 'Unpaid Fines',    value: stats ? `$${parseFloat(stats.unpaidFines).toFixed(2)}` : '—', gradient: 'from-red-500 to-red-600', bg: 'from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20' },
        ].map(({ icon: Icon, label, value, gradient, bg }) => (
          <div key={label} className={`card p-6 bg-gradient-to-br ${bg} hover:shadow-lg transition-all`}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}>
              <Icon size={24} className="text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {stats?.activeBorrows?.length > 0 && (
        <div className="card p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Currently Borrowed</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your active loans and due dates</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
              {stats.activeBorrows.length} books
            </span>
          </div>
          <div className="space-y-3">
            {stats.activeBorrows.map(b => (
              <div key={b.id} className="flex flex-col gap-4 rounded-3xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-all sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-800/30 dark:to-transparent">
                <div className="flex items-center gap-4 flex-1">
                  {normalizeCoverUrl(b.cover_url) ? (
                    <img
                      src={normalizeCoverUrl(b.cover_url)}
                      alt={b.title}
                      className="w-16 h-24 object-cover rounded-2xl shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/30 dark:to-brand-800/20 rounded-2xl flex items-center justify-center">
                      <BookOpen size={20} className="text-brand-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white">{b.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{b.author}</div>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 p-4 text-right min-w-[140px]">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold uppercase tracking-wider">Due Date</div>
                  <div className={`mt-2 text-lg font-bold ${new Date(b.due_date) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-brand-600 dark:text-brand-400'}`}>
                    {format(new Date(b.due_date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.recommended?.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended For You</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Personalized picks based on your interests</p>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Just now</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.recommended.map(b => {
              const coverUrl = normalizeCoverUrl(b.cover_url);
              return (
                <div key={b.id} className="card p-5 text-center hover:shadow-xl transition-all hover:-translate-y-1 group cursor-pointer">
                  <div className="w-full h-32 rounded-2xl mb-4 overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/30 dark:to-brand-800/20 flex items-center justify-center">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <BookOpen size={28} className="text-brand-400" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition">{b.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{b.author}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  user/Books.jsx
// ════════════════════════════════════════════════
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';

export function UserBooks() {
  const [books, setBooks]     = useState([]);
  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [borrowing, setBorrowing] = useState(null);
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get('/books', { params: { search, category_id: catFilter, available: onlyAvail || undefined, limit: 30 } }),
        api.get('/categories'),
      ]);
      setBooks(bRes.data.data);
      setCats(cRes.data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, catFilter, onlyAvail]);

  const handleBorrow = async (book_id) => {
    setBorrowing(book_id);
    try {
      const res = await api.post('/borrows', { book_id });
      const book = books.find(b => b.id === book_id);
      const bookTitle = book?.title || 'Book';
      
      // Show success alert with username and book name
      toast.success(`${user?.full_name} borrowed "${bookTitle}" successfully!`, {
        style: {
          background: '#f0fdf4',
          color: '#166534',
          border: '1px solid #86efac',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        duration: 4000,
      });
      
      addNotification({
        title: 'Book Borrowed',
        message: `You have successfully borrowed "${bookTitle}".`,
      });
      
      load();
      
      // Admin notifications are handled server-side; no client call required.
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow', {
        style: {
          background: '#fef2f2',
          color: '#991b1b',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          padding: '16px',
        },
        duration: 4000,
      });
    } finally { setBorrowing(null); }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Browse Books</h1>

      <div className="flex gap-3 flex-wrap">
        <input className="input text-sm flex-1 min-w-48" placeholder="Search…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input text-sm w-44" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All categories</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer card px-4 py-2">
          <input type="checkbox" checked={onlyAvail} onChange={e => setOnlyAvail(e.target.checked)} className="rounded"/>
          Available only
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_,i) => <div key={i} className="skeleton h-56 rounded-2xl"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map(b => (
            <div key={b.id} className="card p-4 flex flex-col gap-3 hover:shadow-md transition">
              <div className="h-28 overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 flex items-center justify-center">
                {normalizeCoverUrl(b.cover_url) ? (
                  <img
                    src={normalizeCoverUrl(b.cover_url)}
                    alt={b.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <BookOpen size={32} className="text-brand-400"/>
                )}
              </div>
              <div>
                <div className="font-medium text-sm leading-snug truncate">{b.title}</div>
                <div className="text-xs text-gray-400 truncate">{b.author}</div>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className={`text-xs font-medium ${b.available_copies > 0 ? 'text-green-500' : 'text-red-400'}`}>
                  {b.available_copies > 0 ? `${b.available_copies} avail.` : 'Unavailable'}
                </span>
              </div>
              <button
                onClick={() => handleBorrow(b.id)}
                disabled={b.available_copies < 1 || borrowing === b.id}
                className="btn-primary w-full justify-center py-2 text-xs">
                {borrowing === b.id ? '…' : 'Borrow'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  user/MyBorrows.jsx
// ════════════════════════════════════════════════
export function UserBorrows() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [canceling, setCanceling] = useState(null);
  const { addNotification } = useNotifications();

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/borrows'); setRows(data.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleReturn = async (borrow_id) => {
    setReturning(borrow_id);
    try {
      const { data } = await api.post('/borrows/return', { borrow_id });
      const fine = data.data.fine_amount;
      const bookTitle = rows.find(b => b.id === borrow_id)?.title || 'Book';
      const message = fine > 0 ? `Returned! Fine: $${fine.toFixed(2)}` : 'Returned successfully!';
      toast.success(message);
      addNotification({
        title: 'Book Returned',
        message: `"${bookTitle}" has been returned. ${fine > 0 ? `Fine: $${fine.toFixed(2)}` : 'No fines.'}`,
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setReturning(null); }
  };

  const handleCancel = async (borrow_id) => {
    setCanceling(borrow_id);
    try {
      await api.post(`/borrows/${borrow_id}/cancel`);
      const bookTitle = rows.find(b => b.id === borrow_id)?.title || 'Book';
      toast.success('Borrow request cancelled!');
      addNotification({
        title: 'Borrow Cancelled',
        message: `Your request for "${bookTitle}" has been cancelled.`,
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    } finally { setCanceling(null); }
  };

  const STATUS = {
    pending:  'bg-yellow-100 text-yellow-700',
    borrowed: 'bg-blue-100 text-blue-700',
    returned: 'bg-green-100 text-green-700',
    overdue:  'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">My Borrows</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs text-gray-500 text-left">
              {['Book','Borrowed','Due','Status','Fine',''].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_,i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="skeleton h-5"/></td></tr>
            )) : rows.map(r => (
              <tr key={r.id} className="table-row">
                <td className="px-4 py-3 font-medium max-w-[200px] truncate">{r.title}</td>
                <td className="px-4 py-3 text-gray-400">{format(new Date(r.borrowed_at), 'MMM d')}</td>
                <td className="px-4 py-3 text-gray-400">{format(new Date(r.due_date), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3"><span className={`badge ${STATUS[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-xs">{r.fine_amount ? <span className={r.fine_paid ? 'text-green-500' : 'text-red-500'}>${r.fine_amount}</span> : '—'}</td>
                <td className="px-4 py-3">
                  {r.status === 'pending' ? (
                    <button onClick={() => handleCancel(r.id)} disabled={canceling === r.id}
                      className="btn-secondary py-1 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100">
                      {canceling === r.id ? '…' : 'Cancel'}
                    </button>
                  ) : r.status === 'borrowed' || r.status === 'overdue' ? (
                    <button onClick={() => handleReturn(r.id)} disabled={returning === r.id}
                      className="btn-secondary py-1 px-3 text-xs">
                      {returning === r.id ? '…' : 'Return'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
//  user/MyFines.jsx
// ════════════════════════════════════════════════
export function UserFines() {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/fines').then(r => setFines(r.data.data)).finally(() => setLoading(false));
  }, []);
  const total = fines.filter(f => !f.is_paid).reduce((s, f) => s + parseFloat(f.amount), 0);
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My Fines</h1>
        {total > 0 && <div className="card px-4 py-2 text-sm text-red-500 font-bold">Outstanding: ${total.toFixed(2)}</div>}
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs text-gray-500 text-left">
              {['Book','Amount','Reason','Days Overdue','Status'].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(3)].map((_,i) => (
              <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-5"/></td></tr>
            )) : fines.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No fines — great job!</td></tr>
            ) : fines.map(f => (
              <tr key={f.id} className="table-row">
                <td className="px-4 py-3 font-medium truncate max-w-[180px]">{f.title}</td>
                <td className="px-4 py-3 font-medium text-red-500">${parseFloat(f.amount).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize">{f.reason}</td>
                <td className="px-4 py-3">{f.days_overdue}</td>
                <td className="px-4 py-3"><span className={`badge ${f.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{f.is_paid ? 'Paid' : 'Unpaid'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
//  user/Profile.jsx
// ════════════════════════════════════════════════
export function UserProfile() {
  const { user, setUser } = useAuth();
  const fileInputRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState(user?.avatar_url || null);

  const handleProfilePicChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePic', file);

      const response = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.data?.avatar_url) {
        setProfileImage(response.data.data.avatar_url);
        setUser(response.data.data);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        toast.success('Profile picture updated!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and profile information</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-[16px] p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col gap-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-[14px] bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt={user?.full_name} className="w-full h-full object-cover" />
                ) : (
                  user?.full_name?.[0]
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center transition shadow-md"
                title="Change profile picture"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '📷'
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
                disabled={uploading}
              />
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-gray-900">{user?.full_name}</div>
              <div className="text-gray-600 text-sm">{user?.email}</div>
              <div className="text-xs text-gray-500 mt-2 capitalize">
                Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-[16px] p-6 shadow-sm border border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Full Name</label>
              <div className="px-4 py-3 bg-gray-50 rounded-[10px] text-gray-900 font-medium">{user?.full_name || '—'}</div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Email</label>
              <div className="px-4 py-3 bg-gray-50 rounded-[10px] text-gray-900 font-medium">{user?.email || '—'}</div>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold block mb-2">Role</label>
            <div className="inline-block px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-xs font-semibold capitalize">
              {user?.role || '—'}
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600">To update your profile information, please contact the library administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
