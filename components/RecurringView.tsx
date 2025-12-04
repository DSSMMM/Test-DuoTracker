import React, { useState } from 'react';
import { Transaction, Frequency } from '../types';
import { getDaysInMonth, getFirstDayOfMonth, formatCurrency } from '../utils';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
}

export const RecurringView: React.FC<Props> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Filter recurring transactions
  const recurring = transactions.filter(t => t.isRecurring);

  // Helper to check if a day has a recurring expense
  const getExpensesForDay = (day: number) => {
    return recurring.filter(t => {
      // Simplified Logic: Assuming monthly recurrence maps to same day of month
      const tDate = new Date(t.date);
      return tDate.getDate() === day;
    });
  };

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const selectedExpenses = selectedDay ? getExpensesForDay(selectedDay) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDate(new Date(year, month - 1))}
            className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
             onClick={() => setCurrentDate(new Date(year, month + 1))}
             className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs font-bold text-slate-400 uppercase py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map(b => <div key={`blank-${b}`} className="aspect-square" />)}
          {daysArray.map(day => {
            const expenses = getExpensesForDay(day);
            const hasExpense = expenses.length > 0;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all ${
                  isSelected 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105 z-10' 
                    : hasExpense 
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-100' 
                      : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className={`text-sm font-semibold ${hasExpense && !isSelected ? 'font-bold' : ''}`}>{day}</span>
                {hasExpense && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details List */}
      <div className="flex-1">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
            {selectedDay ? `Expenses for ${month + 1}/${selectedDay}` : 'Select a date'}
        </h3>
        
        {selectedExpenses.length > 0 ? (
          <div className="space-y-3">
            {selectedExpenses.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{t.description}</div>
                    <div className="text-xs text-slate-500">{t.vendor || t.category}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800">{formatCurrency(t.amount)}</div>
                  <div className="text-xs text-slate-400 capitalize">{t.type}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No recurring expenses scheduled for this day.
          </div>
        )}
      </div>
    </div>
  );
};
