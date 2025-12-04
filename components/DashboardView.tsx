import React from 'react';
import { Transaction, MonthlyBudget, SavingsProject, ViewState, Category } from '../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getCumulativeMTD, getPriorMonthSpending, getCurrentMonthBudgetTotal, formatCurrency } from '../utils';
import { ArrowRight, TrendingUp, DollarSign, Wallet } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  savings: SavingsProject[];
  onNavigate: (view: ViewState) => void;
}

export const DashboardView: React.FC<Props> = ({ transactions, budgets, savings, onNavigate }) => {
  const mtdData = getCumulativeMTD(transactions);
  
  // Goals Calculations
  const priorMonthSpend = getPriorMonthSpending(transactions);
  const currentBudgetTotal = getCurrentMonthBudgetTotal(budgets);
  const currentMonth = new Date().getMonth();
  const mtdSpend = transactions
    .filter(t => new Date(t.date).getMonth() === currentMonth)
    .reduce((acc, t) => acc + t.amount, 0);

  // Calculate Savings Deduction for proper "Left to Spend"
  const savingsDeduction = savings
    .filter(s => s.deductFromBudget)
    .reduce((acc, s) => acc + s.amount, 0); // Simplified frequency logic for demo
  
  const effectiveBudget = currentBudgetTotal - savingsDeduction;
  const remaining = effectiveBudget - mtdSpend;

  const recentTransactions = [...transactions]
    .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-6">
      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <div>
            <h2 className="text-slate-500 text-xs font-bold uppercase tracking-wider">MTD Spending</h2>
            <div className="text-2xl font-black text-indigo-900 mt-1">
              {formatCurrency(mtdSpend)}
            </div>
          </div>
          <button 
            onClick={() => onNavigate('SPENDING')}
            className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-indigo-100 transition-colors"
          >
            Details <ArrowRight size={14} />
          </button>
        </div>
        
        <div className="h-40 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mtdData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMtd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#94a3b8'}}
                interval="preserveStartEnd"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => [formatCurrency(val), 'Cumulative']}
                labelFormatter={(label) => `Day ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMtd)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Goals Section */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-2">
             <TrendingUp size={16} />
           </div>
           <span className="text-[10px] font-bold text-slate-400 uppercase">Prior Month</span>
           <span className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(priorMonthSpend)}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
           <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
             <Wallet size={16} />
           </div>
           <span className="text-[10px] font-bold text-slate-400 uppercase">Budget</span>
           <span className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(effectiveBudget)}</span>
        </div>
        <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 flex flex-col items-center text-center text-white">
           <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-2">
             <DollarSign size={16} />
           </div>
           <span className="text-[10px] font-bold text-indigo-200 uppercase">Left</span>
           <span className="text-sm font-bold mt-1">{formatCurrency(remaining)}</span>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Recent Activity</h3>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {recentTransactions.map((t, i) => (
            <div key={t.id} className={`flex items-center justify-between p-4 ${i !== recentTransactions.length - 1 ? 'border-b border-slate-50' : ''}`}>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-lg">
                    {t.category === Category.FOOD ? '🍔' : 
                     t.category === Category.TRANSPORT ? '🚕' : 
                     t.category === Category.GROCERIES ? '🛒' : '💸'}
                 </div>
                 <div>
                   <div className="font-semibold text-slate-800 text-sm">{t.description}</div>
                   <div className="text-xs text-slate-400 flex items-center gap-1">
                      {new Date(t.date).toLocaleDateString()}
                      {t.time && <span>• {t.time}</span>}
                   </div>
                 </div>
               </div>
               <div className="font-bold text-slate-800">
                 -{t.amount.toFixed(2)}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};