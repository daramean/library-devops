import React, { useEffect, useState } from 'react';
import { BookOpen, Users, AlertTriangle, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { api } from '../../context/AuthContext';
import { format } from 'date-fns';

const STATUS_COLORS = {
  borrowed: '#6b4fa6', returned: '#10b981', overdue: '#ef4444', lost: '#6b7280'
};

function StatCard({ icon: Icon, label, value, sub, color = 'brand', trend = null }) {
  const colors = {
    brand:  'bg-purple-100 text-brand-600',
    green:  'bg-green-100 text-green-600',
    red:    'bg-red-100 text-red-600',
    amber:  'bg-amber-100 text-amber-600',
    blue:   'bg-blue-100 text-blue-600',
  };

  return (
    <div className="bg-white rounded-[16px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center ${colors[color]}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="font-display text-2xl font-bold text-gray-900">{value ?? '—'}</div>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-2">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] p-6 space-y-4 skeleton">
      <div className="skeleton h-12 w-12 rounded-[12px]" />
      <div className="skeleton h-8 w-24" />
      <div className="skeleton h-4 w-32" />
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
      <div className="space-y-8 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i}/>)}
        </div>
      </div>
    );
  }

  const pieData = stats?.categoryStats?.map(c => ({ name: c.name, value: parseInt(c.borrows, 10) })) || [];
  const PIE_COLORS = ['#6b4fa6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#f97316','#06b6d4'];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-600 font-semibold mb-3">Welcome back</p>
            <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Library Dashboard</h1>
            <p className="text-gray-600 text-base leading-6">
              Monitor library operations, track book circulation, and manage member activities in real-time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-[14px] p-4 border border-purple-200">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold mb-2">Total Books</p>
              <p className="font-display text-3xl font-bold text-gray-900">{stats?.books?.total ?? '—'}</p>
              <p className="text-xs text-gray-600 mt-2">{stats?.books?.available} available</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-[14px] p-4 border border-green-200">
              <p className="text-xs uppercase tracking-[0.15em] text-gray-600 font-semibold mb-2">Members</p>
              <p className="font-display text-3xl font-bold text-gray-900">{stats?.users?.total ?? '—'}</p>
              <p className="text-xs text-gray-600 mt-2">Active users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Total Books" value={stats?.books?.total} sub={`${stats?.books?.available} available`} color="brand" trend={12} />
        <StatCard icon={Users} label="Active Members" value={stats?.users?.total} color="green" trend={8} />
        <StatCard icon={TrendingUp} label="Active Borrows" value={stats?.activeBorrows} color="blue" trend={15} />
        <StatCard icon={AlertTriangle} label="Overdue Books" value={stats?.overdue} color="red" trend={-3} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="lg:col-span-2 bg-white rounded-[16px] p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="font-display text-lg font-semibold text-gray-900">Monthly Borrow Trends</h2>
            <p className="text-sm text-gray-600 mt-1">Books borrowed over the last 12 months</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats?.monthlyTrend || []}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#d1d5db" />
              <YAxis tick={{ fontSize: 12 }} stroke="#d1d5db" />
              <Tooltip 
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                cursor={{ stroke: '#6b4fa6', strokeWidth: 2 }}
              />
              <Line dataKey="borrows" stroke="#6b4fa6" strokeWidth={3} dot={{ fill: '#6b4fa6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-[16px] p-6 shadow-sm border border-gray-100">
          <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4 pt-4 border-t">
            {pieData.slice(0, 4).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-gray-700 truncate">{d.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Borrows Table */}
      <div className="bg-white rounded-[16px] p-6 shadow-sm border border-gray-100">
        <div className="mb-6">
          <h2 className="font-display text-lg font-semibold text-gray-900">Circulated Books</h2>
          <p className="text-sm text-gray-600 mt-1">Recent borrow activity and member information</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase tracking-[0.15em] border-b border-gray-200">
                <th className="pb-4 font-semibold">Member</th>
                <th className="pb-4 font-semibold">Book</th>
                <th className="pb-4 font-semibold">Borrowed</th>
                <th className="pb-4 font-semibold">Due</th>
                <th className="pb-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentActivity || []).map(r => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
                        {r.full_name?.[0]}
                      </div>
                      <span className="font-medium text-gray-900">{r.full_name}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-gray-600 truncate max-w-[200px]">{r.title}</td>
                  <td className="py-4 pr-4 text-gray-600">{format(new Date(r.borrowed_at), 'MMM d')}</td>
                  <td className="py-4 pr-4 text-gray-600">{format(new Date(r.due_date), 'MMM d')}</td>
                  <td className="py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize
                      ${r.status === 'borrowed' ? 'bg-blue-100 text-blue-700' : ''}
                      ${r.status === 'returned' ? 'bg-green-100 text-green-700' : ''}
                      ${r.status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                      ${r.status === 'lost' ? 'bg-gray-100 text-gray-700' : ''}
                    `}>
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
