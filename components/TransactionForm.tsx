
import React, { useState, useEffect } from 'react';
import { Transaction, Category, Frequency } from '../types';
import { generateUUID } from '../utils';
import { suggestCategory } from '../services/geminiService';
import { Sparkles, Loader2, X, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  initialData?: Transaction | null;
  transactions: Transaction[];
}

export const TransactionForm: React.FC<Props> = ({ isOpen, onClose, onSave, onDelete, initialData, transactions }) => {
  const [formData, setFormData] = useState<Transaction>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    description: '',
    amount: 0,
    category: Category.OTHER,
    type: Frequency.ONE_TIME,
    endDate: undefined,
    notes: '',
    vendor: '',
    isRecurring: false
  });
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  useEffect(() => {
    setIsDeleteConfirming(false); // Reset delete state when opening/changing data
    if (initialData) {
      setFormData({
          ...initialData,
          time: initialData.time || ''
      });
    } else {
      setFormData({
        id: generateUUID(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        description: '',
        amount: 0,
        category: Category.OTHER,
        type: Frequency.ONE_TIME,
        endDate: undefined,
        notes: '',
        vendor: '',
        isRecurring: false
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSuggestCategory = async () => {
      const desc = formData.description;
      const vend = formData.vendor || '';

      if (!desc && !vend) return;
      
      setIsSuggesting(true);
      const uniqueMap = new Map<string, string>();
      for (let i = transactions.length - 1; i >= 0; i--) {
          const t = transactions[i];
          const key = (t.vendor || t.description).trim();
          if (key && !uniqueMap.has(key)) {
              uniqueMap.set(key, t.category);
          }
          if (uniqueMap.size >= 30) break;
      }
      const examples = Array.from(uniqueMap.entries()).map(([text, category]) => ({ text, category }));
      const category = await suggestCategory(desc, vend, examples);
      setIsSuggesting(false);
      if (category) {
          const match = Object.values(Category).find(c => c === category);
          if (match) setFormData(prev => ({ ...prev, category: match }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();

      console.log("Form: Delete button clicked");

      // Step 1: Enter confirmation mode
      if (!isDeleteConfirming) {
          setIsDeleteConfirming(true);
          return;
      }
      
      // Step 2: Actually delete
      if (onDelete && initialData && initialData.id) {
          const idToDelete = initialData.id;
          console.log(`Form: Confirmed. Calling onDelete for ID: "${idToDelete}"`);
          onDelete(idToDelete);
      } else {
          console.error("Form: Cannot delete. Missing onDelete prop or initialData.id", { hasOnDelete: !!onDelete, initialData });
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{initialData ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pb-safe">
          {/* Amount Input - Prominent */}
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
             <input
                 type="number" step="0.01" required autoFocus={!initialData}
                 className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-3xl font-black text-slate-800 outline-none transition-all placeholder:text-slate-300"
                 value={formData.amount || ''}
                 onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                 placeholder="0.00"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Date</label>
                  <input
                    type="date" required
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Time</label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                    value={formData.time || ''}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
              </div>
          </div>

          <div>
              <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Category</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as Category})}
              >
                {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Description</label>
             <div className="relative">
                <input
                    type="text" required
                    className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="What was this for?"
                />
                <button 
                    type="button" onClick={handleSuggestCategory}
                    disabled={isSuggesting}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-500 bg-indigo-50 rounded-lg"
                >
                    {isSuggesting ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                </button>
             </div>
          </div>
          
          {/* Vendor Input */}
          <div>
             <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Merchant / Vendor</label>
             <input
                 type="text"
                 className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                 value={formData.vendor || ''}
                 onChange={e => setFormData({...formData, vendor: e.target.value})}
                 placeholder="e.g. Starbucks, Target"
             />
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl">
             <div className="flex-1">
                 <div className="text-sm font-bold text-slate-700">Recurring Expense?</div>
                 <div className="text-xs text-slate-400">Repeats regularly</div>
             </div>
             <input 
                type="checkbox" 
                className="w-6 h-6 accent-indigo-600"
                checked={formData.isRecurring}
                onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
             />
          </div>

          {formData.isRecurring && (
              <div className="animate-in slide-in-from-top-2 space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1 block">Frequency</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 rounded-xl font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as Frequency})}
                    >
                        {Object.values(Frequency).filter(f => f !== Frequency.ONE_TIME).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                 </div>
                 {/* Notes for recurring warning */}
                 <div className="bg-amber-50 text-amber-700 p-3 rounded-xl text-xs font-medium border border-amber-100">
                     Editing this recurring rule will update all future instances generated from this transaction.
                 </div>
              </div>
          )}

          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-[0.98] transition-transform"
            >
              Save Transaction
            </button>

            {initialData && onDelete && (
                <div className="relative">
                    {isDeleteConfirming ? (
                        <div className="flex gap-2">
                             <button
                                type="button"
                                onClick={() => setIsDeleteConfirming(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex-[2] py-4 bg-rose-600 text-white border-2 border-rose-600 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 animate-in fade-in"
                            >
                                <AlertTriangle size={20} /> Confirm Delete
                            </button>
                        </div>
                    ) : (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="w-full py-4 bg-white text-rose-500 border-2 border-rose-100 rounded-2xl font-bold text-lg active:scale-[0.98] transition-transform hover:bg-rose-50 flex items-center justify-center gap-2"
                        >
                          <Trash2 size={20} /> Delete Transaction
                        </button>
                    )}
                </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
