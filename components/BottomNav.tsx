
import React from 'react';
import { LayoutDashboard, CalendarDays, PieChart, PiggyBank, List, User } from 'lucide-react';
import { ViewState, ThemeColor } from '../types';

interface Props {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  theme: ThemeColor;
}

export const BottomNav: React.FC<Props> = ({ currentView, onViewChange, theme }) => {
  const items = [
    { id: 'DASHBOARD' as ViewState, icon: LayoutDashboard, label: 'Dash' },
    { id: 'RECURRING' as ViewState, icon: CalendarDays, label: 'Recurring' },
    { id: 'SPENDING' as ViewState, icon: PieChart, label: 'Spending' },
    { id: 'TRANSACTIONS' as ViewState, icon: List, label: 'History' },
    { id: 'BUDGET' as ViewState, icon: PiggyBank, label: 'Budget' },
    { id: 'PROFILE' as ViewState, icon: User, label: 'Profile' },
  ];

  // Map theme to text color class
  const activeColorClass = {
      indigo: 'text-indigo-600',
      emerald: 'text-emerald-600',
      rose: 'text-rose-600',
      amber: 'text-amber-600',
      sky: 'text-sky-600',
      violet: 'text-violet-600',
  }[theme];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 pb-safe z-50 shadow-lg">
      <div className="max-w-lg mx-auto flex justify-between items-center">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center gap-1 transition-all duration-200 min-w-[3rem] ${
                isActive ? activeColorClass : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon 
                size={22} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
              />
              <span className="text-[9px] font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
