import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ScanLine, History as HistoryIcon, PlusCircle, CreditCard } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import { Expense, AppView } from './types';

// Dummy data for initial hydration if storage is empty
const DUMMY_DATA: Expense[] = [
  { id: '1', merchant: 'Starbucks', amount: 5.40, currency: 'USD', date: '2023-10-15', category: 'Food & Dining', embedding: [], items: ['Latte', 'Muffin'] },
  { id: '2', merchant: 'Uber', amount: 24.50, currency: 'USD', date: '2023-10-18', category: 'Transportation', embedding: [], items: ['Ride to Airport'] },
  { id: '3', merchant: 'Amazon', amount: 120.00, currency: 'USD', date: '2023-10-20', category: 'Shopping', embedding: [], items: ['Headphones'] },
  { id: '4', merchant: 'Starbucks', amount: 4.80, currency: 'USD', date: '2023-11-01', category: 'Food & Dining', embedding: [], items: ['Coffee'] },
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('visualfin_expenses');
    if (stored) {
      setExpenses(JSON.parse(stored));
    } else {
      setExpenses(DUMMY_DATA);
    }
  }, []);

  // Save to local storage whenever expenses change
  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem('visualfin_expenses', JSON.stringify(expenses));
    }
  }, [expenses]);

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev]);
    setView(AppView.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col gap-8 sticky top-0 h-auto md:h-screen z-10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ScanLine className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">VisualFin</span>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={() => setView(AppView.DASHBOARD)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppView.DASHBOARD ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setView(AppView.SCANNER)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppView.SCANNER ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <PlusCircle className="w-5 h-5" />
            <span className="font-medium">New Analysis</span>
          </button>

          <button 
            onClick={() => setView(AppView.HISTORY)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === AppView.HISTORY ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <HistoryIcon className="w-5 h-5" />
            <span className="font-medium">History</span>
          </button>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-800">
           <div className="bg-slate-800/50 p-4 rounded-xl">
             <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">System Status</h4>
             <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               Gemini Flash (Vision)
             </div>
             <div className="flex items-center gap-2 text-xs text-purple-400">
               <div className="w-2 h-2 rounded-full bg-purple-500"></div>
               Vector Store (Local)
             </div>
           </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {view === AppView.DASHBOARD && 'Financial Overview'}
              {view === AppView.SCANNER && 'AI Receipt Analysis'}
              {view === AppView.HISTORY && 'Transaction History'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {view === AppView.DASHBOARD && 'Your real-time financial health tracked by Gemini.'}
              {view === AppView.SCANNER && 'Multimodal extraction & proactive semantic advisory.'}
              {view === AppView.HISTORY && 'All past expenses stored with vector embeddings.'}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Personal Account</span>
          </div>
        </header>

        {view === AppView.DASHBOARD && <Dashboard expenses={expenses} />}
        
        {view === AppView.SCANNER && (
          <Scanner 
            onSave={addExpense} 
            history={expenses} 
            onCancel={() => setView(AppView.DASHBOARD)} 
          />
        )}
        
        {view === AppView.HISTORY && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase">Merchant</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase">Date</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase">Category</th>
                  <th className="p-4 text-xs font-medium text-slate-400 uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 font-medium text-white">{expense.merchant}</td>
                    <td className="p-4 text-slate-400 text-sm">{expense.date}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-semibold text-white">
                      ${expense.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
