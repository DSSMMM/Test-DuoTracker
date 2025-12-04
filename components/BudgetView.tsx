import React, { useState } from 'react';
import { MonthlyBudget, SavingsProject, Category, Frequency } from '../types';
import { CATEGORY_COLORS } from '../constants';
import { formatCurrency } from '../utils';
import { Plus, Trash2, Save, FileText } from 'lucide-react';
import { DataService } from '../services/firebase';

interface Props {
  budgets: MonthlyBudget[];
  savings: SavingsProject[];
}

export const BudgetView: React.FC<Props> = ({ budgets, savings }) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentBudget = budgets.find(b => b.month === currentMonthStr) || { month: currentMonthStr, categories: {} };
  
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState<Partial<SavingsProject>>({
      name: '', amount: 0, frequency: Frequency.MONTHLY, deductFromBudget: true, memo: ''
  });

  const totalBudget = Object.values(currentBudget.categories).reduce((sum, val) => sum + (val || 0), 0);
  const totalSavingsDeduction = savings.filter(s => s.deductFromBudget).reduce((sum, s) => sum + s.amount, 0);
  const netBudget = totalBudget - totalSavingsDeduction;

  const handleBudgetChange = (cat: Category, val: string) => {
     DataService.setBudget(currentMonthStr, cat, parseFloat(val) || 0);
  };

  const handleSaveProject = () => {
      if(newProject.name && newProject.amount) {
          DataService.addSavingsProject(newProject as SavingsProject);
          setIsAddingProject(false);
          setNewProject({ name: '', amount: 0, frequency: Frequency.MONTHLY, deductFromBudget: true, memo: '' });
      }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
         <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                 <div>
                     <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Net Annual Budget</div>
                     <div className="text-3xl font-black mt-1">{formatCurrency(netBudget * 12)}</div>
                 </div>
                 <div className="text-right">
                     <div className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Monthly Net</div>
                     <div className="text-xl font-bold mt-1">{formatCurrency(netBudget)}</div>
                 </div>
             </div>
             <div className="flex gap-4 pt-4 border-t border-white/10">
                 <div>
                     <div className="text-[10px] text-indigo-300 uppercase">Gross Budget</div>
                     <div className="font-semibold">{formatCurrency(totalBudget)}</div>
                 </div>
                 <div>
                     <div className="text-[10px] text-indigo-300 uppercase">Project Savings</div>
                     <div className="font-semibold text-emerald-300">-{formatCurrency(totalSavingsDeduction)}</div>
                 </div>
             </div>
         </div>
      </div>

      {/* Monthly Budget Inputs */}
      <div>
          <h3 className="font-bold text-slate-800 mb-4 px-2">Monthly Allocations</h3>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {Object.values(Category).map(cat => (
                  <div key={cat} className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-3">
                          <div className="w-2 h-8 rounded-full" style={{backgroundColor: CATEGORY_COLORS[cat]}} />
                          <span className="text-sm font-semibold text-slate-700">{cat}</span>
                      </div>
                      <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-sm">$</span>
                          <input 
                              type="number" 
                              className="w-20 text-right font-bold text-slate-800 outline-none border-b border-transparent focus:border-indigo-500 transition-all placeholder:text-slate-300"
                              placeholder="0"
                              value={currentBudget.categories[cat] || ''}
                              onChange={(e) => handleBudgetChange(cat, e.target.value)}
                          />
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* Savings Projects */}
      <div>
          <div className="flex justify-between items-center px-2 mb-4">
              <h3 className="font-bold text-slate-800">Savings Projects</h3>
              <button 
                onClick={() => setIsAddingProject(true)}
                className="text-indigo-600 bg-indigo-50 p-2 rounded-full hover:bg-indigo-100"
              >
                  <Plus size={20} />
              </button>
          </div>
          
          {isAddingProject && (
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-indigo-100 mb-4 animate-in slide-in-from-top-2">
                  <input 
                    type="text" placeholder="Project Name" 
                    className="w-full font-bold text-lg outline-none mb-3 placeholder:text-slate-300"
                    value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <input 
                            type="number" className="w-full bg-slate-50 rounded-xl py-2 pl-6 pr-3 text-sm outline-none"
                            placeholder="Amount"
                            value={newProject.amount || ''} onChange={e => setNewProject({...newProject, amount: parseFloat(e.target.value)})}
                          />
                      </div>
                      <select 
                        className="bg-slate-50 rounded-xl py-2 px-3 text-sm outline-none"
                        value={newProject.frequency}
                        onChange={e => setNewProject({...newProject, frequency: e.target.value as Frequency})}
                      >
                          {Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                  </div>
                  <input 
                    type="text" placeholder="Add a memo..." 
                    className="w-full bg-slate-50 rounded-xl py-2 px-3 text-sm outline-none mb-3"
                    value={newProject.memo} onChange={e => setNewProject({...newProject, memo: e.target.value})}
                  />
                  <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-slate-500">Deduct from Budget?</span>
                      <input 
                        type="checkbox" className="w-5 h-5 accent-indigo-600"
                        checked={newProject.deductFromBudget}
                        onChange={e => setNewProject({...newProject, deductFromBudget: e.target.checked})}
                      />
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAddingProject(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancel</button>
                      <button onClick={handleSaveProject} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Project</button>
                  </div>
              </div>
          )}

          <div className="space-y-3">
              {savings.map(project => (
                  <div key={project.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative group">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="font-bold text-slate-800">{project.name}</div>
                              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{project.frequency}</span>
                                  {project.memo && <span className="flex items-center gap-1"><FileText size={10}/> {project.memo}</span>}
                              </div>
                          </div>
                          <div className="text-right">
                              <div className="font-bold text-emerald-600">{formatCurrency(project.amount)}</div>
                              {project.deductFromBudget && <div className="text-[10px] text-slate-400 bg-slate-50 px-1 rounded inline-block mt-1">Deducted</div>}
                          </div>
                      </div>
                      <button 
                        onClick={() => DataService.deleteSavingsProject(project.id)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                          <Trash2 size={12} />
                      </button>
                  </div>
              ))}
          </div>
      </div>

    </div>
  );
};