import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { formatCurrency, formatTime } from '../utils';
import { RefreshCw, Search, Filter, ChevronRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  onEdit?: (t: Transaction) => void;
  className?: string;
}

export const TransactionList: React.FC<Props> = ({ transactions, onEdit, className }) => {
  const [showRecurring, setShowRecurring] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Filter and Sort
  const filtered = transactions
    .filter(t => {
      const matchesRecurring = showRecurring || !t.isRecurring;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchesMin = minAmount === '' || t.amount >= Number(minAmount);
      const matchesMax = maxAmount === '' || t.amount <= Number(maxAmount);
      
      return matchesRecurring && matchesSearch && matchesCategory && matchesMin && matchesMax;
    })
    .sort((a, b) => {
      // Sort by Date then Time
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col ${className || 'h-full'}`}>
      {/* Header & Filters */}
      <div className="p-4 border-b border-slate-50 space-y-3 shrink-0">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Transactions</h3>
          
          <button
            onClick={() => setShowRecurring(!showRecurring)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
              showRecurring 
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                : 'bg-white border border-slate-200 text-slate-400'
            }`}
          >
            <RefreshCw size={12} className={showRecurring ? "" : "opacity-50"} />
            {showRecurring ? 'Recurring: On' : 'Recurring: Off'}
          </button>
        </div>

        <div className="flex gap-2">
            {/* Search */}
            <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    className="w-full bg-slate-50 rounded-xl py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Category Filter */}
            <div className="relative w-1/3">
                 <select
                    className="w-full appearance-none bg-slate-50 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 border border-transparent"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as Category | 'ALL')}
                 >
                     <option value="ALL">All Categories</option>
                     {Object.values(Category).map(c => (
                         <option key={c} value={c}>{c}</option>
                     ))}
                 </select>
                 <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>

        {/* Amount Range Filter */}
        <div className="flex gap-2 pt-1">
            <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                <input 
                    type="number" 
                    placeholder="Min Amount" 
                    className="w-full bg-slate-50 rounded-xl py-2 pl-6 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                />
            </div>
            <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                <input 
                    type="number" 
                    placeholder="Max Amount" 
                    className="w-full bg-slate-50 rounded-xl py-2 pl-6 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 text-slate-700 font-medium"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                />
            </div>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {filtered.length === 0 ? (
           <div className="p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
               <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                   <Search size={20} className="opacity-50"/>
               </div>
               No transactions found
           </div>
        ) : (
           filtered.map((t, i) => (
            <div 
                key={t.id} 
                onClick={() => onEdit && onEdit(t)}
                className={`flex items-center justify-between p-4 transition-colors ${i !== filtered.length - 1 ? 'border-b border-slate-50' : ''} ${onEdit ? 'hover:bg-indigo-50/50 cursor-pointer active:bg-indigo-50' : 'hover:bg-slate-50'}`}
            >
               <div className="flex items-center gap-3 overflow-hidden">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${t.isRecurring ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {t.isRecurring ? <RefreshCw size={18} /> : (t.category === Category.FOOD ? '🍔' : t.category === Category.TRANSPORT ? '🚕' : '💸')}
                 </div>
                 <div className="min-w-0">
                   {t.vendor && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{t.vendor}</div>}
                   <div className="font-semibold text-slate-800 text-sm truncate pr-2">{t.description}</div>
                   <div className="text-xs text-slate-400 flex items-center gap-1">
                     {new Date(t.date).toLocaleDateString()}
                     {t.time && <span> • {formatTime(t.time)}</span>}
                     {t.isRecurring && <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 rounded-full uppercase tracking-wider ml-1">Recurring</span>}
                   </div>
                 </div>
               </div>
               <div className="flex items-center gap-3 shrink-0">
                   <div className="font-bold text-slate-800">
                     -{formatCurrency(t.amount)}
                   </div>
                   {onEdit && <ChevronRight size={16} className="text-slate-300" />}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};