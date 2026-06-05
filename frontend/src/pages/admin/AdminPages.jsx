// ════════════════════════════════════════════════
//  Admin/Borrows.jsx
// ════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const USER_ROLES = ['admin', 'librarian', 'user'];

function AddUserModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!open) setForm({ full_name: '', email: '', password: '', phone: '', role: 'user' });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users', form);
      toast.success('User added successfully');
      addNotification({
        title: 'New user added',
        message: `${form.full_name} (${form.role}) has been added to the system.`,
      });
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to add user');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-display font-bold text-lg">Add User</h2>
          <button onClick={onClose}><span className="text-xl">×</span></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
            <input
              className="input text-sm"
              placeholder="Full Name"
              value={form.full_name}
              onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
            <input
              type="email"
              className="input text-sm"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
            <input
              type="password"
              className="input text-sm"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
            <input
              className="input text-sm"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
            <select
              className="input text-sm w-full"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ open, user, onClose, onSaved }) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!open) setNewPassword('');
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await api.put(`/users/${user.id}/password`, { password: newPassword });
      toast.success('Password reset successfully');
      addNotification({
        title: 'Password reset',
        message: `Password for ${user.full_name} has been reset.`,
      });
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-display font-bold text-lg">Reset Password</h2>
            <p className="text-sm text-gray-500">Set a new password for {user.full_name}</p>
          </div>
          <button onClick={onClose}><span className="text-xl">×</span></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 grid gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New Password</label>
            <input
              type="password"
              className="input text-sm w-full"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminBorrows() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [processing, setProcessing] = useState({ id: null, action: '' });
  const [returnModal, setReturnModal] = useState(null);
  const [returnDate, setReturnDate] = useState('');
  const [returnCondition, setReturnCondition] = useState('good');
  const [approveModal, setApproveModal] = useState(null);
  const { addNotification } = useNotifications();

  const openReturnModal = (borrowId) => {
    setReturnModal(borrowId);
    setReturnDate('');
    setReturnCondition('good');
  };

  const openApproveModal = (borrowId) => {
    setApproveModal(borrowId);
  };

  const handleReturn = async () => {
    if (!returnModal) return;
    setProcessing({ id: returnModal, action: 'return' });
    try {
      await api.post('/borrows/return', {
        borrow_id: returnModal,
        returned_at: returnDate || undefined,
        condition: returnCondition,
      });
      const borrow = rows.find((r) => r.id === returnModal);
      toast.success('Book return recorded successfully');
      addNotification({
        title: 'Book returned',
        message: `${borrow?.user_name}'s return for "${borrow?.title}" has been recorded.`,
      });
      setReturnModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to process return');
    } finally {
      setProcessing({ id: null, action: '' });
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/borrows', { params: { status } });
      setRows(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status]);

  const STATUS_STYLE = {
    pending:  'bg-yellow-100 text-yellow-700',
    borrowed: 'bg-blue-100 text-blue-700',
    returned: 'bg-green-100 text-green-700',
    overdue:  'bg-red-100  text-red-700',
    rejected: 'bg-red-100 text-red-700',
    lost:     'bg-gray-100 text-gray-600',
  };

  const handleApprove = async () => {
    if (!approveModal) return;
    setProcessing({ id: approveModal, action: 'approve' });
    try {
      await api.post(`/borrows/${approveModal}/approve`);
      toast.success('Borrow request approved');
      const borrow = rows.find(r => r.id === approveModal);
      addNotification({
        title: 'Borrow request approved',
        message: `${borrow?.user_name} can now borrow "${borrow?.title}".`,
      });
      setApproveModal(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to approve borrow request');
    } finally {
      setProcessing({ id: null, action: '' });
    }
  };

  const handleReject = async (borrowId) => {
    setProcessing({ id: borrowId, action: 'reject' });
    try {
      await api.post(`/borrows/${borrowId}/reject`);
      toast.success('Borrow request rejected');
      const borrow = rows.find(r => r.id === borrowId);
      addNotification({
        title: 'Borrow request rejected',
        message: `Request from ${borrow?.user_name} for "${borrow?.title}" has been rejected.`,
      });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Unable to reject borrow request');
    } finally {
      setProcessing({ id: null, action: '' });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Borrow Records</h1>
        <select className="input text-sm w-36" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All status</option>
          {['pending','borrowed','returned','overdue','rejected','lost'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr className="text-xs text-gray-500 text-left">
                {['Member','Book','Borrowed','Due','Status','Fine','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_,i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5"/></td></tr>
              )) : rows.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="px-4 py-3 font-medium">{r.user_name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{r.title}</td>
                  <td className="px-4 py-3 text-gray-400">{format(new Date(r.borrowed_at), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-gray-400">{format(new Date(r.due_date), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.fine_amount ? (
                      <span className={`text-xs font-medium ${r.fine_paid ? 'text-green-500' : 'text-red-500'}`}>
                        ${r.fine_amount} {r.fine_paid ? '✓' : '(unpaid)'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApproveModal(r.id)}
                          disabled={processing.id === r.id}
                          className="btn-primary py-1 px-3 text-xs"
                        >
                          {processing.id === r.id && processing.action === 'approve' ? 'Approving…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          disabled={processing.id === r.id}
                          className="btn-secondary py-1 px-3 text-xs"
                        >
                          {processing.id === r.id && processing.action === 'reject' ? 'Rejecting…' : 'Reject'}
                        </button>
                      </div>
                    ) : ['borrowed','overdue'].includes(r.status) ? (
                      <button
                        onClick={() => openReturnModal(r.id)}
                        disabled={processing.id === r.id}
                        className="btn-secondary py-1 px-3 text-xs"
                      >
                        {processing.id === r.id && processing.action === 'return' ? 'Processing…' : 'Return'}
                      </button>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {approveModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl shadow-black/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Approve borrow request</h2>
                <p className="text-sm text-gray-500">This borrower will receive the default loan period for the book.</p>
              </div>
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                className="text-gray-400 transition hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">No due date entry is required; the system will calculate the return date based on the book loan period.</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setApproveModal(null)}
                className="btn-secondary py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={processing.id === approveModal && processing.action === 'approve'}
                className="btn-primary py-2 px-4"
              >
                {processing.id === approveModal && processing.action === 'approve' ? 'Approving…' : 'Approve borrow'}
              </button>
            </div>
          </div>
        </div>
      )}
      {returnModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl shadow-black/10">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Set return date</h2>
                <p className="text-sm text-gray-500">Record the returned book and optional return date.</p>
              </div>
              <button
                type="button"
                onClick={() => setReturnModal(null)}
                className="text-gray-400 transition hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Returned date</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Condition</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value)}
                  className="input w-full"
                >
                  <option value="good">Good</option>
                  <option value="damaged">Damaged</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReturnModal(null)}
                className="btn-secondary py-2 px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReturn}
                disabled={processing.id === returnModal && processing.action === 'return'}
                className="btn-primary py-2 px-4"
              >
                {processing.id === returnModal && processing.action === 'return' ? 'Saving…' : 'Save return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
//  Admin/Users.jsx
// ════════════════════════════════════════════════
export function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const { addNotification } = useNotifications();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { search } });
      setUsers(data.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search]);

  const toggleUser = async (id) => {
    const user = users.find(u => u.id === id);
    await api.put(`/users/${id}/toggle`);
    toast.success('User status updated');
    addNotification({
      title: 'User status changed',
      message: `${user?.full_name} has been ${user?.is_active ? 'disabled' : 'enabled'}.`,
    });
    load();
  };

  return (
    <>
      <AddUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
      <ResetPasswordModal
        open={Boolean(resetUser)}
        user={resetUser}
        onClose={() => setResetUser(null)}
        onSaved={() => { setResetUser(null); load(); }}
      />
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold">Users</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setModalOpen(true)} className="btn-primary">Add User</button>
            <input className="input text-sm w-64" placeholder="Search name or email…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs text-gray-500 text-left">
              {['Name','Email','Role','Borrows','Last Login','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(5)].map((_,i) => (
              <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5"/></td></tr>
            )) : users.map(u => (
              <tr key={u.id} className="table-row">
                <td className="px-4 py-3 font-medium">{u.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 capitalize">
                  <span className={`badge ${u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">{u.active_borrows}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.last_login ? format(new Date(u.last_login), 'MMM d') : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button onClick={() => setResetUser(u)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition">
                    Reset
                  </button>
                  <button onClick={() => toggleUser(u.id)}
                    className="text-xs text-gray-400 hover:text-brand-500 transition">
                    {u.is_active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

// ════════════════════════════════════════════════
//  Admin/Fines.jsx
// ════════════════════════════════════════════════
export function AdminFines() {
  const [fines, setFines]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/fines'); setFines(data.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markPaid = async (id) => {
    const fine = fines.find(f => f.id === id);
    await api.post(`/fines/${id}/pay`);
    toast.success('Fine marked as paid');
    addNotification({
      title: 'Fine payment recorded',
      message: `${fine?.full_name}'s fine for "${fine?.title}" ($${parseFloat(fine?.amount).toFixed(2)}) has been marked as paid.`,
    });
    load();
  };

  const total = fines.filter(f => !f.is_paid).reduce((s, f) => s + parseFloat(f.amount), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Fines</h1>
        <div className="card px-4 py-2 text-sm">
          Outstanding: <span className="font-bold text-red-500">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs text-gray-500 text-left">
              {['Member','Book','Amount','Reason','Days Overdue','Status',''].map(h => (
                <th key={h} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(4)].map((_,i) => (
              <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="skeleton h-5"/></td></tr>
            )) : fines.map(f => (
              <tr key={f.id} className="table-row">
                <td className="px-4 py-3 font-medium">{f.full_name}</td>
                <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{f.title}</td>
                <td className="px-4 py-3 font-medium text-red-500">${parseFloat(f.amount).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize">{f.reason}</td>
                <td className="px-4 py-3">{f.days_overdue}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${f.is_paid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {f.is_paid ? 'Paid' : 'Unpaid'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!f.is_paid && (
                    <button onClick={() => markPaid(f.id)} className="text-xs btn-primary py-1 px-2">
                      Mark Paid
                    </button>
                  )}
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
//  Admin/Activity.jsx
// ════════════════════════════════════════════════
export function AdminActivity() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activity').then(r => setLogs(r.data.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="font-display text-2xl font-bold">Activity Log</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr className="text-xs text-gray-500 text-left">
              {['User','Action','Time','IP'].map(h => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(6)].map((_,i) => (
              <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="skeleton h-5"/></td></tr>
            )) : logs.map(l => (
              <tr key={l.id} className="table-row">
                <td className="px-4 py-3 font-medium">{l.full_name || 'System'}</td>
                <td className="px-4 py-3"><code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{l.action}</code></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{format(new Date(l.created_at), 'MMM d, HH:mm')}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{l.ip_address || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminBorrows;
