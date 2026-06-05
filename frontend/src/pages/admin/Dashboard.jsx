import React, { useEffect, useState } from 'react';
import { BookOpen, Users, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../../context/AuthContext';
import { format } from 'date-fns';

const STATUS_COLORS = {
  borrowed: '#3b5bdb', returned: '#10b981', overdue: '#ef4444', lost: '#6b7280'
};

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }) {
  const colors = {
    brand:  'bg-brand-50 text-brand-500 dark:bg-brand-900/20',
    green:  'bg-green-50 text-green-500 dark:bg-green-900/20',
    red:    'bg-red-50 text-red-500 dark:bg-red-900/20',
    amber:  'bg-amber-50 text-amber-500 dark:bg-amber-900/20',
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        {sub && <span className="text-xs uppercase tracking-[0.24em] text-gray-400">{sub}</span>}
      </div>
      <div className="font-display text-3xl font-bold">{value ?? '—'}</div>
      <div className="text-sm text-gray-500 mt-2">{label}</div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-4">
      <div className="skeleton h-11 w-11 rounded-2xl" />
      <div className="skeleton h-7 w-24" />
      <div className="skeleton h-4 w-36" />
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i}/>)}
        </div>
      </div>
    );
  }

  const pieData = stats?.categoryStats?.map(c => ({ name: c.name, value: parseInt(c.borrows, 10) })) || [];
  const PIE_COLORS = ['#3b5bdb','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#f97316','#06b6d4'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6">
        <div className="card overflow-hidden bg-gradient-to-r from-brand-600 to-indigo-700 text-white border-0 shadow-2xl">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <span className="text-xs uppercase tracking-[0.3em] text-brand-200">Library intelligence</span>
                <h1 className="mt-3 text-3xl font-bold">Admin dashboard</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-brand-100/90">
                  Overview of books, members, and borrow activity. Use the metrics below to keep operations running smoothly.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[320px]">
                <div className="rounded-[28px] bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">Total books</p>
                  <p className="mt-3 text-3xl font-semibold">{stats?.books?.total ?? '—'}</p>
                </div>
                <div className="rounded-[28px] bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-white/70">Members</p>
                  <p className="mt-3 text-3xl font-semibold">{stats?.users?.total ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Total Books" value={stats?.books?.total} sub={`${stats?.books?.available} available`} color="brand" />
          <StatCard icon={Users} label="Active Users" value={stats?.users?.total} color="green" />
          <StatCard icon={TrendingUp} label="Active Borrows" value={stats?.activeBorrows} color="brand" />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats?.overdue} color="red" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-semibold">Monthly borrows</h3>
              <p className="text-sm text-gray-500">Track borrow volume across the year.</p>
            </div>
            <div className="text-sm text-gray-500">
              {stats?.monthlyTrend?.length ?? 0} months of data
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats?.monthlyTrend || []}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="borrows" fill="#3b5bdb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-display text-lg font-semibold mb-4">Category distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={82} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {pieData.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span>{d.name}</span>
                </div>
                <span className="font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold">Recent borrows</h3>
            <p className="text-sm text-gray-500">Latest borrow activity for the library.</p>
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-gray-400">Updated {format(new Date(), 'MMM d')}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-200 dark:border-gray-800">
                <th className="pb-3 font-medium">Member</th>
                <th className="pb-3 font-medium">Book</th>
                <th className="pb-3 font-medium">Borrowed</th>
                <th className="pb-3 font-medium">Due</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentActivity || []).map(r => (
                <tr key={r.id} className="table-row">
                  <td className="py-3 pr-4 font-medium">{r.full_name}</td>
                  <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 truncate max-w-[180px]">{r.title}</td>
                  <td className="py-3 pr-4 text-gray-500">{format(new Date(r.borrowed_at), 'MMM d')}</td>
                  <td className="py-3 pr-4 text-gray-500">{format(new Date(r.due_date), 'MMM d')}</td>
                  <td className="py-3">
                    <span className="badge" style={{ background: STATUS_COLORS[r.status] + '22', color: STATUS_COLORS[r.status] }}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
