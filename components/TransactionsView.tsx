import React from 'react';
import { Transaction } from '../types';
import { TransactionList } from './TransactionList';

interface Props {
  transactions: Transaction[];
  onEditTransaction: (t: Transaction) => void;
}

export const TransactionsView: React.FC<Props> = ({ transactions, onEditTransaction }) => {
  return (
    <div className="h-full flex flex-col pb-6">
      <div className="mb-4">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">History</h2>
          <p className="text-slate-500 text-sm">View and edit all past transactions</p>
      </div>
      
      {/* Full height container for the list */}
      <div className="flex-1 min-h-0">
          <TransactionList transactions={transactions} onEdit={onEditTransaction} />
      </div>
    </div>
  );
};