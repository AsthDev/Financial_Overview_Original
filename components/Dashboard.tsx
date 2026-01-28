import React, { useMemo } from 'react';
import { Expense } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ expenses }) => {
  
  const totalSpent = useMemo(() => expenses.reduce((acc, curr) => acc + curr.amount, 0), [expenses]);
  
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    expenses.forEach(e => {
      data[e.category] = (data[e.category] || 0) + e.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const recentActivity = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stat Cards */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Total Spending</h3>
            <div className="p-2 bg-emerald-500/10 rounded-full">
              <DollarSign className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">${totalSpent.toFixed(2)}</p>
          <div className="mt-2 flex items-center text-xs text-emerald-400">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Tracking {expenses.length} expenses</span>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Top Category</h3>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-xl font-bold text-white truncate">
             {categoryData.sort((a,b) => b.value - a.value)[0]?.name || 'N/A'}
          </p>
           <div className="mt-2 flex items-center text-xs text-blue-400">
            <span>Highest volume sector</span>
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
           <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Monthly Trend</h3>
            <div className="p-2 bg-purple-500/10 rounded-full">
              <TrendingDown className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <p className="text-xl font-bold text-white">Stable</p>
           <div className="mt-2 flex items-center text-xs text-purple-400">
            <span>Based on recent entries</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg min-h-[300px]">
          <h3 className="text-lg font-semibold text-white mb-6">Spending by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6">Recent Transactions</h3>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No transactions yet.</p>
            ) : (
              recentActivity.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                      {expense.category === 'Food & Dining' ? '🍔' : 
                       expense.category === 'Transportation' ? '🚕' : 
                       expense.category === 'Shopping' ? '🛍️' : '📄'}
                    </div>
                    <div>
                      <p className="font-medium text-white">{expense.merchant}</p>
                      <p className="text-xs text-slate-400">{expense.date} • {expense.category}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-white">
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
