import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, MonthlyBudget, Category } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CATEGORY_COLORS } from '../constants';
import { formatCurrency } from '../utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TransactionList } from './TransactionList';

interface Props {
  transactions: Transaction[];
  budgets: MonthlyBudget[];
}

type Period = 'DAILY' | 'MONTHLY' | 'YEARLY';

export const SpendingView: React.FC<Props> = ({ transactions, budgets }) => {
  const [period, setPeriod] = useState<Period>('MONTHLY');
  
  // Helper to extract key from date string based on period
  const getKey = (dateStr: string, p: Period) => {
    if (!dateStr) return '';
    if (p === 'DAILY') return dateStr; // YYYY-MM-DD
    if (p === 'MONTHLY') return dateStr.slice(0, 7); // YYYY-MM
    if (p === 'YEARLY') return dateStr.slice(0, 4); // YYYY
    return dateStr;
  };

  // --- Navigation Logic ---
  
  // 1. Get unique keys (Days, Months, or Years) from transactions
  const availableKeys = useMemo(() => {
    const keys = new Set<string>();
    transactions.forEach(t => {
        if (t.date) keys.add(getKey(t.date, period));
    });
    const sorted = Array.from(keys).sort();
    
    // Always include current period key if not present
    const currentKey = getKey(new Date().toISOString().split('T')[0], period);
    if (!keys.has(currentKey)) {
        sorted.push(currentKey);
        sorted.sort();
    }
    return sorted;
  }, [transactions, period]);

  // 2. State for currently selected key
  const [selectionKey, setSelectionKey] = useState<string>(() => getKey(new Date().toISOString().split('T')[0], 'MONTHLY'));

  // 3. Reset/Validate selection when period or data changes
  useEffect(() => {
     const currentNeededKey = getKey(new Date().toISOString().split('T')[0], period);
     
     // When switching periods, try to map the existing selection to the new period format if possible
     // e.g. 2024-05-15 (Daily) -> 2024-05 (Monthly)
     // But simpler UX is often just jumping to the most recent available data or today
     if (availableKeys.length > 0 && !availableKeys.includes(selectionKey)) {
        // Default to the last available (most recent) to show data
        setSelectionKey(availableKeys[availableKeys.length - 1]);
     } else if (availableKeys.length === 0) {
        setSelectionKey(currentNeededKey);
     }
  }, [period, availableKeys, selectionKey]);

  const handlePrev = () => {
      const idx = availableKeys.indexOf(selectionKey);
      if (idx > 0) {
          setSelectionKey(availableKeys[idx - 1]);
      }
  };

  const handleNext = () => {
      const idx = availableKeys.indexOf(selectionKey);
      if (idx < availableKeys.length - 1) {
          setSelectionKey(availableKeys[idx + 1]);
      }
  };

  // --- Data Preparation ---

  // Chart Data: Adaptive window based on period
  const chartData = useMemo(() => {
    const data = [];
    
    // Helper to calculate date relative to selection
    // Note: We parse selectionKey carefully to avoid timezone issues
    const getTargetDate = (offset: number) => {
        if (period === 'DAILY') {
            // Treat strings as reliable local time
            const base = new Date(selectionKey + 'T00:00:00');
            base.setDate(base.getDate() - offset);
            return base;
        } else if (period === 'MONTHLY') {
            const [y, m] = selectionKey.split('-').map(Number);
            const d = new Date(y, m - 1 - offset, 1);
            return d;
        } else {
            // Yearly
            const y = parseInt(selectionKey);
            const d = new Date(y - offset, 0, 1);
            return d;
        }
    };

    // Determine loop range based on period
    // Positive offset = Past, Negative offset = Future (for Daily)
    let startOffset = 0;
    let endOffset = 0;

    if (period === 'DAILY') {
        startOffset = 5;  // 5 days ago
        endOffset = -5;   // 5 days in future
    } else if (period === 'MONTHLY') {
        startOffset = 5;  // 5 months ago
        endOffset = 0;    // current month
    } else { // YEARLY
        startOffset = 2;  // 2 years ago
        endOffset = 0;    // current year
    }

    for (let i = startOffset; i >= endOffset; i--) {
        const d = getTargetDate(i);
        let key = '';
        let label = '';
        let tooltipLabel = '';
        let budgetTotal = 0;

        if (period === 'DAILY') {
             // YYYY-MM-DD
             const yyyy = d.getFullYear();
             const mm = String(d.getMonth() + 1).padStart(2, '0');
             const dd = String(d.getDate()).padStart(2, '0');
             key = `${yyyy}-${mm}-${dd}`;
             
             // X-Axis Label: Just the day number (e.g., "12")
             label = String(d.getDate());
             // Tooltip Label: Full context (e.g., "Mon 12")
             tooltipLabel = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`;
             
             // Daily budget approximation (Monthly / Days in Month)
             const monthKey = `${yyyy}-${mm}`;
             const bObj = budgets.find(b => b.month === monthKey);
             const mTotal = bObj ? Object.values(bObj.categories).reduce((s, v) => s + (v || 0), 0) : 0;
             const daysInMonth = new Date(yyyy, d.getMonth() + 1, 0).getDate();
             budgetTotal = mTotal / daysInMonth;

        } else if (period === 'MONTHLY') {
             const yyyy = d.getFullYear();
             const mm = String(d.getMonth() + 1).padStart(2, '0');
             key = `${yyyy}-${mm}`;
             label = d.toLocaleDateString('en-US', { month: 'short' });
             tooltipLabel = label;
             
             const bObj = budgets.find(b => b.month === key);
             budgetTotal = bObj ? Object.values(bObj.categories).reduce((s, v) => s + (v || 0), 0) : 0;
        } else {
             // Yearly
             const yyyy = d.getFullYear();
             key = String(yyyy);
             label = String(yyyy);
             tooltipLabel = label;
             
             // Sum of all monthly budgets in that year
             budgetTotal = budgets
                .filter(b => b.month.startsWith(key))
                .reduce((acc, b) => acc + Object.values(b.categories).reduce((s, v) => s + (v||0), 0), 0);
        }

        // Calculate Actual
        const actual = transactions
            .filter(t => t.date.startsWith(key))
            .reduce((sum, t) => sum + t.amount, 0);

        data.push({
            name: label,
            tooltipLabel,
            fullKey: key,
            Budget: budgetTotal,
            Actual: actual,
            isCurrent: key === selectionKey
        });
    }
    return data;
  }, [selectionKey, period, transactions, budgets]);

  // Pie Data: Specific to selectionKey
  const categoryData = useMemo(() => {
      return Object.values(Category).map(cat => {
          const amount = transactions
            .filter(t => t.category === cat && t.date.startsWith(selectionKey))
            .reduce((sum, t) => sum + t.amount, 0);
          return { name: cat, value: amount };
      }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [selectionKey, transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  // Filter transactions for the list
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => t.date.startsWith(selectionKey));
  }, [transactions, selectionKey]);

  const isFirst = availableKeys.indexOf(selectionKey) === 0;
  const isLast = availableKeys.indexOf(selectionKey) === availableKeys.length - 1;

  // Header Title Formatting
  const displayTitle = useMemo(() => {
      if (!selectionKey) return '';
      if (period === 'DAILY') {
          // Parse YYYY-MM-DD safely
          const [y, m, d] = selectionKey.split('-').map(Number);
          return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
      }
      if (period === 'MONTHLY') {
          const [y, m] = selectionKey.split('-').map(Number);
          return new Date(y, m - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      return selectionKey; // Year
  }, [selectionKey, period]);

  return (
    <div className="space-y-6 pb-20">
       {/* Filter Toggle */}
       <div className="flex bg-slate-200/50 p-1 rounded-xl w-full">
         {['DAILY', 'MONTHLY', 'YEARLY'].map((p) => (
             <button
                key={p}
                onClick={() => setPeriod(p as Period)}
                className={`flex-1 text-[10px] font-bold py-2 rounded-lg transition-all ${
                    period === p ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
                }`}
             >
                 {p}
             </button>
         ))}
       </div>

       {/* Main Chart */}
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Budget vs Actual</h3>
              <div className="flex gap-2">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <div className="w-2 h-2 rounded-full bg-slate-200" /> Budget
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" /> Actual
                  </span>
              </div>
          </div>
          <div className="h-48">
             <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} barGap={4}>
                     <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} interval={0} />
                     <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: number) => formatCurrency(val)}
                        labelFormatter={(label, payload) => {
                            // Use tooltipLabel from payload if available for better context
                            if (payload && payload.length > 0 && payload[0].payload.tooltipLabel) {
                                return payload[0].payload.tooltipLabel;
                            }
                            return label;
                        }}
                     />
                     <Bar dataKey="Budget" fill="#e2e8f0" radius={[4, 4, 4, 4]} />
                     <Bar dataKey="Actual" fill="#6366f1" radius={[4, 4, 4, 4]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#4f46e5' : '#6366f1'} fillOpacity={entry.isCurrent ? 1 : 0.7} />
                        ))}
                     </Bar>
                 </BarChart>
             </ResponsiveContainer>
          </div>
       </div>

       {/* Navigation */}
       <div className="flex items-center justify-between px-4">
           <button 
             onClick={handlePrev}
             disabled={isFirst}
             className={`p-2 rounded-full shadow-sm transition-colors ${isFirst ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-500 hover:text-indigo-600'}`}
           >
               <ChevronLeft size={20} />
           </button>
           <span className="font-bold text-slate-800 text-lg">{displayTitle}</span>
           <button 
             onClick={handleNext}
             disabled={isLast}
             className={`p-2 rounded-full shadow-sm transition-colors ${isLast ? 'bg-slate-50 text-slate-300' : 'bg-white text-slate-500 hover:text-indigo-600'}`}
           >
               <ChevronRight size={20} />
           </button>
       </div>

       {/* Breakdown */}
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <h3 className="font-bold text-slate-800 mb-4">Breakdown</h3>
           {categoryData.length > 0 ? (
               <div className="flex flex-col sm:flex-row items-center gap-6">
                   <div className="w-40 h-40 shrink-0 relative">
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                               <Pie
                                 data={categoryData}
                                 innerRadius={40}
                                 outerRadius={70}
                                 paddingAngle={5}
                                 dataKey="value"
                               >
                                   {categoryData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                   ))}
                               </Pie>
                           </PieChart>
                       </ResponsiveContainer>
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                           <span className="text-xs font-bold text-slate-400">Total</span>
                       </div>
                   </div>
                   <div className="w-full space-y-3">
                       {categoryData.map((item, idx) => (
                           <div key={item.name} className="flex items-center justify-between">
                               <div className="flex items-center gap-2">
                                   <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}} />
                                   <span className="text-sm font-medium text-slate-600">{item.name}</span>
                               </div>
                               <span className="text-sm font-bold text-slate-800">{formatCurrency(item.value)}</span>
                           </div>
                       ))}
                   </div>
               </div>
           ) : (
               <div className="text-center py-10 text-slate-400 text-sm">
                   No spending data for this period.
               </div>
           )}
       </div>

       {/* Transaction List */}
       <TransactionList transactions={filteredTransactions} />
    </div>
  );
};