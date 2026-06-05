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
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-brand-500 uppercase tracking-[0.3em]">Welcome back</p>
              <h1 className="mt-3 text-3xl font-bold">{user?.full_name ?? 'Library member'}</h1>
              <p className="mt-3 text-sm text-gray-500 max-w-2xl">
                Here's a quick summary of your current borrow activity and recommendations.
              </p>
            </div>
            <div className="rounded-3xl bg-brand-50/80 p-4 text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-brand-600">Notices</p>
              <p className="mt-3 text-3xl font-semibold text-brand-700">{stats?.dueSoon?.length ?? 0}</p>
              <p className="text-xs text-gray-500">books due soon</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="card p-5 bg-brand-600 text-white border-0 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Current status</p>
                <p className="mt-3 text-2xl font-bold">{stats?.activeBorrows?.length ?? 0} books borrowed</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-3">
                <BookOpen size={22} />
              </div>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Quick summary</p>
            <div className="mt-4 grid gap-3">
              {[
                { label: 'Due soon', value: stats?.dueSoon?.length ?? 0, tone: 'text-amber-600 bg-amber-50' },
                { label: 'Unpaid fines', value: stats ? `$${parseFloat(stats.unpaidFines).toFixed(2)}` : '—', tone: 'text-red-600 bg-red-50' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                  <div>
                    <p className="text-xs text-gray-500">{item.label}</p>
                    <p className="mt-1 text-lg font-semibold">{item.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.tone}`}>
                    <span className="text-sm">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { icon: BookOpen,       label: 'Active borrows', value: stats?.activeBorrows?.length ?? '—', color: 'text-brand-500 bg-brand-50' },
          { icon: Clock,          label: 'Total borrowed',  value: stats?.totalBorrowed ?? '—',          color: 'text-green-500 bg-green-50' },
          { icon: AlertTriangle,  label: 'Due soon',        value: stats?.dueSoon?.length ?? '—',        color: 'text-amber-500 bg-amber-50' },
          { icon: DollarSign,     label: 'Unpaid fines',    value: stats ? `$${parseFloat(stats.unpaidFines).toFixed(2)}` : '—', color: 'text-red-500 bg-red-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
              <Icon size={22}/>
            </div>
            <div className="font-display text-3xl font-bold">{value}</div>
            <div className="text-sm text-gray-500 mt-2">{label}</div>
          </div>
        ))}
      </div>

      {stats?.activeBorrows?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Currently borrowed</h3>
              <p className="text-sm text-gray-500">Your active loans and due dates.</p>
            </div>
            <span className="text-sm text-gray-500">{stats.activeBorrows.length} records</span>
          </div>
          <div className="space-y-3">
            {stats.activeBorrows.map(b => (
              <div key={b.id} className="flex flex-col gap-3 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {normalizeCoverUrl(b.cover_url) ? (
                    <img
                      src={normalizeCoverUrl(b.cover_url)}
                      alt={b.title}
                      className="w-14 h-20 object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="w-14 h-20 bg-brand-100 dark:bg-brand-900 rounded-2xl flex items-center justify-center">
                      <BookOpen size={18} className="text-brand-500" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{b.title}</div>
                    <div className="text-xs text-gray-500">{b.author}</div>
                  </div>
                </div>
                <div className="rounded-3xl bg-gray-50 dark:bg-gray-900 p-3 text-right min-w-[120px]">
                  <div className="text-xs text-gray-500 uppercase">Due</div>
                  <div className={`mt-1 text-sm font-semibold ${new Date(b.due_date) < new Date() ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
                    {format(new Date(b.due_date), 'MMM d')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats?.recommended?.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-lg font-semibold">Recommended for you</h3>
            <span className="text-sm text-gray-500">Updated now</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.recommended.map(b => {
              const coverUrl = normalizeCoverUrl(b.cover_url);
              return (
                <div key={b.id} className="card p-4 text-center hover:shadow-lg transition cursor-pointer">
                  <div className="w-full h-24 rounded-3xl mb-3 overflow-hidden bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={b.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen size={24} className="text-brand-400" />
                    )}
                  </div>
                  <div className="text-xs font-semibold truncate">{b.title}</div>
                  <div className="text-xs text-gray-400 truncate">{b.author}</div>
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

export function UserBooks() {
  const [books, setBooks]     = useState([]);
  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [borrowing, setBorrowing] = useState(null);

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
      await api.post('/borrows', { book_id });
      toast.success('Book borrowed successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to borrow');
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
      toast.success(fine > 0 ? `Returned! Fine: $${fine.toFixed(2)}` : 'Returned successfully!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally { setReturning(null); }
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
                  {r.status === 'borrowed' || r.status === 'overdue' ? (
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
  const { user } = useAuth();
  return (
    <div className="space-y-5 animate-fade-in max-w-lg">
      <h1 className="font-display text-2xl font-bold">Profile</h1>
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-2xl font-bold text-brand-600">
            {user?.full_name?.[0]}
          </div>
          <div>
            <div className="font-display font-bold text-xl">{user?.full_name}</div>
            <div className="text-gray-500">{user?.email}</div>
            <div className="text-xs badge bg-brand-50 text-brand-600 mt-1 capitalize">{user?.role}</div>
          </div>
        </div>
        <div className="text-sm text-gray-500 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          Profile editing coming soon. Contact admin to update your details.
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
