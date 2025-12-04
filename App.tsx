
import React, { useState, useEffect } from 'react';
import { Transaction, MonthlyBudget, SavingsProject, ViewState, UserProfile, ThemeColor } from './types';
import { DataService, UserService } from './services/firebase';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { RecurringView } from './components/RecurringView';
import { SpendingView } from './components/SpendingView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetView } from './components/BudgetView';
import { ProfileView } from './components/ProfileView';
import { TransactionForm } from './components/TransactionForm';
import { Plus, Download, FileDown } from 'lucide-react';
import { parseData, generateUUID } from './utils';
import * as xlsx from 'xlsx';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  
  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [savings, setSavings] = useState<SavingsProject[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [theme, setTheme] = useState<ThemeColor>('indigo');

  // Subscriptions
  useEffect(() => {
    const unsubTx = DataService.subscribeTransactions(setTransactions);
    const unsubBg = DataService.subscribeBudgets(setBudgets);
    const unsubSv = DataService.subscribeSavings(setSavings);

    // Load User Profile
    const loadProfile = async () => {
        const profile = await UserService.getProfile();
        setUserProfile(profile);
        setTheme(profile.theme);
    };
    loadProfile();

    return () => {
      unsubTx();
      unsubBg();
      unsubSv();
    };
  }, []);

  const handleSaveTransaction = (t: Transaction) => {
    const exists = transactions.some(existing => existing.id === t.id);
    if (exists) {
        DataService.updateTransaction(t);
    } else {
        DataService.addTransaction(t);
    }
    setEditingTransaction(null); // Clear editing state
  };

  const handleDeleteTransaction = async (id: string) => {
    console.log("App: handleDeleteTransaction called with ID:", id);
    await DataService.deleteTransaction(id);
    handleCloseModal();
  };

  const handleEditTransaction = (t: Transaction) => {
      setEditingTransaction(t);
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingTransaction(null);
  };

  // CSV/Excel Handling
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onload = (evt) => {
          if (evt.target?.result) {
              const parsed = parseData(evt.target.result as ArrayBuffer);
              parsed.forEach(t => {
                // Ensure vendor is set from parsing or defaults
                DataService.addTransaction({...t, id: generateUUID()} as Transaction);
              });
              alert(`Successfully imported ${parsed.length} transactions!`);
          }
       };
       reader.readAsArrayBuffer(file);
    }
  };

  const handleDownloadTemplate = () => {
      const headers = ["Date", "Time", "Vendor", "Category", "Description", "Amount", "Notes"];
      const exampleRow = ["2024-05-21", "14:30", "Starbucks", "Food & Dining", "Coffee run", "15.50", "Meeting with client"];
      
      const ws = xlsx.utils.aoa_to_sheet([headers, exampleRow]);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Template");
      xlsx.writeFile(wb, "DuoBudget_Template.xlsx");
  };

  // Profile Handling
  const handleThemeChange = async (newTheme: ThemeColor) => {
      setTheme(newTheme);
      const updated = await UserService.updateTheme(newTheme);
      setUserProfile(updated);
  };

  const handleInviteUser = async (id: string) => {
      const updated = await UserService.addViewer(id);
      setUserProfile(updated);
  };

  // Dynamic Theme Colors
  const getThemeClasses = () => {
      switch (theme) {
          case 'emerald': return { gradient: 'from-emerald-600 to-teal-600', fab: 'bg-emerald-600 shadow-emerald-300', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' };
          case 'rose': return { gradient: 'from-rose-600 to-pink-600', fab: 'bg-rose-600 shadow-rose-300', iconBg: 'bg-rose-100', iconText: 'text-rose-600' };
          case 'amber': return { gradient: 'from-amber-500 to-orange-500', fab: 'bg-amber-500 shadow-amber-300', iconBg: 'bg-amber-100', iconText: 'text-amber-600' };
          case 'sky': return { gradient: 'from-sky-500 to-blue-500', fab: 'bg-sky-500 shadow-sky-300', iconBg: 'bg-sky-100', iconText: 'text-sky-600' };
          case 'violet': return { gradient: 'from-violet-600 to-purple-600', fab: 'bg-violet-600 shadow-violet-300', iconBg: 'bg-violet-100', iconText: 'text-violet-600' };
          default: return { gradient: 'from-indigo-600 to-violet-600', fab: 'bg-indigo-600 shadow-indigo-300', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' };
      }
  };
  const themeStyles = getThemeClasses();

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900 pb-24 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Mobile Container */}
      <div className="max-w-lg mx-auto bg-slate-50 min-h-screen relative shadow-2xl shadow-slate-200 flex flex-col">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 transition-colors duration-500">
          <h1 className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${themeStyles.gradient} tracking-tight`}>
            DuoBudget
          </h1>
          <div className="flex items-center gap-3">
              {/* Import/Export Tools - Only on Transactions/Budget views or Dashboard */}
              <div className="flex items-center gap-1">
                 <button onClick={handleDownloadTemplate} title="Download Template" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                     <FileDown size={20} />
                 </button>
                 <label className="p-2 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer">
                     <Download size={20} />
                     <input type="file" accept=".csv, .xlsx, .xls" onChange={handleImport} className="hidden" />
                 </label>
              </div>

              {/* Profile Icon / Initials */}
              <button 
                onClick={() => setCurrentView('PROFILE')}
                className={`w-8 h-8 rounded-full ${themeStyles.iconBg} flex items-center justify-center ${themeStyles.iconText} font-bold text-xs transition-colors`}
              >
                {userProfile?.id.substring(0,2).toUpperCase() || 'ME'}
              </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6 flex-1 min-h-0 overflow-y-auto">
          {currentView === 'DASHBOARD' && (
            <DashboardView 
              transactions={transactions} 
              budgets={budgets} 
              savings={savings} 
              onNavigate={setCurrentView}
            />
          )}
          
          {currentView === 'RECURRING' && (
            <RecurringView transactions={transactions} />
          )}
          
          {currentView === 'SPENDING' && (
            <SpendingView transactions={transactions} budgets={budgets} />
          )}

          {currentView === 'TRANSACTIONS' && (
            <TransactionsView transactions={transactions} onEditTransaction={handleEditTransaction} />
          )}
          
          {currentView === 'BUDGET' && (
            <BudgetView budgets={budgets} savings={savings} />
          )}

          {currentView === 'PROFILE' && (
            <ProfileView 
                userProfile={userProfile} 
                onThemeChange={handleThemeChange} 
                onInviteUser={handleInviteUser}
                theme={theme}
            />
          )}
        </main>

        {/* FAB (Floating Action Button) for Adding Transactions */}
        {currentView !== 'PROFILE' && (
            <button
            onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}
            className={`fixed bottom-24 right-6 w-14 h-14 ${themeStyles.fab} text-white rounded-full shadow-xl flex items-center justify-center z-40 active:scale-95 transition-all duration-300`}
            >
            <Plus size={28} strokeWidth={2.5} />
            </button>
        )}

        {/* Navigation */}
        <BottomNav currentView={currentView} onViewChange={setCurrentView} theme={theme} />
      
      </div>

      {/* Modals */}
      <TransactionForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        initialData={editingTransaction}
        transactions={transactions}
      />

    </div>
  );
};

export default App;
