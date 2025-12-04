
export enum Category {
  HOUSING = 'Housing',
  FOOD = 'Food & Dining',
  GROCERIES = 'Groceries',
  TRANSPORT = 'Transportation',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  HEALTH = 'Health & Fitness',
  SHOPPING = 'Shopping',
  TRAVEL = 'Travel',
  OTHER = 'Other'
}

export enum Frequency {
  ONE_TIME = 'One-time',
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  BIWEEKLY = 'Biweekly',
  MONTHLY = 'Monthly',
  BIMONTHLY = 'Bimonthly',
  QUARTERLY = 'Quarterly',
  YEARLY = 'Yearly'
}

export interface Transaction {
  id: string;
  date: string; // ISO YYYY-MM-DD
  time?: string; // HH:mm 24-hour format
  description: string;
  amount: number;
  category: Category;
  type: Frequency;
  // Recurring specific fields
  endDate?: string;
  parentId?: string;
  notes?: string;
  vendor?: string;
  isRecurring?: boolean;
}

export interface SavingsProject {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  memo?: string;
  deductFromBudget: boolean;
}

export type Budgets = Partial<Record<Category, number>>;

// Stores budget limits for a specific month (YYYY-MM)
export interface MonthlyBudget {
  month: string; // YYYY-MM
  categories: Budgets;
}

export type ViewState = 'DASHBOARD' | 'RECURRING' | 'SPENDING' | 'BUDGET' | 'TRANSACTIONS' | 'PROFILE';

export type ThemeColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'sky' | 'violet';

export interface UserProfile {
  id: string;
  theme: ThemeColor;
  viewers: string[]; // List of UserIDs allowed to view this data
}

export interface GeminiInsight {
  title: string;
  content: string;
  type: 'saving' | 'trend' | 'alert' | 'positive';
}
