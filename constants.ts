import { Category, Frequency, Transaction, SavingsProject, Budgets } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.HOUSING]: '#6366f1', // Indigo
  [Category.FOOD]: '#f43f5e', // Rose
  [Category.GROCERIES]: '#10b981', // Emerald
  [Category.TRANSPORT]: '#f59e0b', // Amber
  [Category.UTILITIES]: '#0ea5e9', // Sky
  [Category.ENTERTAINMENT]: '#8b5cf6', // Violet
  [Category.HEALTH]: '#ec4899', // Pink
  [Category.SHOPPING]: '#14b8a6', // Teal
  [Category.TRAVEL]: '#f97316', // Orange
  [Category.OTHER]: '#64748b', // Slate
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0], // Today
    time: '14:30',
    description: 'Weekly Groceries',
    amount: 156.42,
    category: Category.GROCERIES,
    type: Frequency.WEEKLY,
    vendor: 'Whole Foods',
    isRecurring: true,
  },
  {
    id: '2',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    time: '18:45',
    description: 'Uber Ride',
    amount: 24.50,
    category: Category.TRANSPORT,
    type: Frequency.ONE_TIME,
    vendor: 'Uber'
  },
  {
    id: '3',
    date: '2024-05-01',
    time: '09:00',
    description: 'Rent Payment',
    amount: 2200,
    category: Category.HOUSING,
    type: Frequency.MONTHLY,
    vendor: 'Apartment Corp',
    isRecurring: true
  },
  {
    id: '4',
    date: '2024-05-15',
    time: '10:00',
    description: 'Netflix Subscription',
    amount: 15.99,
    category: Category.ENTERTAINMENT,
    type: Frequency.MONTHLY,
    vendor: 'Netflix',
    isRecurring: true
  },
  {
    id: '5',
    date: '2024-05-20',
    time: '06:30',
    description: 'Gym Membership',
    amount: 45.00,
    category: Category.HEALTH,
    type: Frequency.MONTHLY,
    vendor: 'Gold\'s Gym',
    isRecurring: true
  }
];

export const INITIAL_BUDGETS: Budgets = {
  [Category.HOUSING]: 2200,
  [Category.GROCERIES]: 600,
  [Category.FOOD]: 400,
  [Category.ENTERTAINMENT]: 200,
  [Category.TRANSPORT]: 300
};

export const INITIAL_SAVINGS_PROJECTS: SavingsProject[] = [
  {
    id: 's1',
    name: 'Summer Vacation',
    amount: 200,
    frequency: Frequency.MONTHLY,
    deductFromBudget: true,
    memo: 'Trip to Italy in July'
  },
  {
    id: 's2',
    name: 'New Car Fund',
    amount: 50,
    frequency: Frequency.WEEKLY,
    deductFromBudget: false,
    memo: 'Saving for a Tesla'
  }
];

export const CATEGORY_THRESHOLDS: Record<Category, number> = {
  [Category.HOUSING]: 4000,
  [Category.FOOD]: 800,
  [Category.GROCERIES]: 1000,
  [Category.TRANSPORT]: 800,
  [Category.UTILITIES]: 600,
  [Category.ENTERTAINMENT]: 500,
  [Category.HEALTH]: 500,
  [Category.SHOPPING]: 1500,
  [Category.TRAVEL]: 5000,
  [Category.OTHER]: 500,
};