
import { Transaction, MonthlyBudget, SavingsProject, Category, Frequency, UserProfile, ThemeColor } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_SAVINGS_PROJECTS } from '../constants';
import { generateUUID } from '../utils';

// --- REAL FIREBASE SETUP (Uncomment and fill to use) ---
/*
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, addDoc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
*/

// --- MOCK ADAPTER (Uses LocalStorage to simulate Firestore) ---

const STORAGE_KEYS = {
  TRANSACTIONS: 'duobudget_transactions',
  BUDGETS: 'duobudget_budgets',
  SAVINGS: 'duobudget_savings',
  USER_PROFILE: 'duobudget_user_profile'
};

// Initialize Local Data if empty
const initMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
    // Convert flat initial budgets to monthly format for demo
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const initialMonthly: MonthlyBudget[] = [{
        month: currentMonth,
        categories: INITIAL_BUDGETS
    }];
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(initialMonthly));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SAVINGS)) {
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(INITIAL_SAVINGS_PROJECTS));
  }
  // Initialize Profile if missing
  if (!localStorage.getItem(STORAGE_KEYS.USER_PROFILE)) {
      const newProfile: UserProfile = {
          id: generateUUID(), // Generate a persistent ID for this user
          theme: 'indigo',
          viewers: []
      };
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile));
  }
};

initMockData();

// Mock Listeners
const listeners: Record<string, Function[]> = {
  transactions: [],
  budgets: [],
  savings: [],
  profile: []
};

const notify = (key: string, data: any) => {
  if (listeners[key]) {
      console.log(`[DataService] Notifying ${listeners[key].length} listener(s) for ${key}`);
      listeners[key].forEach(cb => cb(data));
  } else {
      console.warn(`[DataService] No listeners found for ${key}`);
  }
};

export const DataService = {
  // --- TRANSACTIONS ---
  subscribeTransactions: (callback: (data: Transaction[]) => void) => {
    // Initial Load
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const data = JSON.parse(raw || '[]');
    callback(data);
    
    // Register listener
    listeners.transactions.push(callback);
    // console.log("[DataService] Subscribed to Transactions. Active listeners:", listeners.transactions.length);
    
    // Return unsubscribe
    return () => {
      listeners.transactions = listeners.transactions.filter(cb => cb !== callback);
      // console.log("[DataService] Unsubscribed from Transactions. Active listeners:", listeners.transactions.length);
    };
  },

  addTransaction: async (t: Omit<Transaction, 'id'>) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    const newT = { ...t, id: generateUUID() };
    const updated = [...data, newT];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    notify('transactions', updated);
  },

  updateTransaction: async (t: Transaction) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    // Robust comparison for update as well
    const updated = data.map((item: Transaction) => String(item.id).trim() === String(t.id).trim() ? t : item);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    notify('transactions', updated);
  },

  deleteTransaction: async (id: string) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const data = JSON.parse(raw || '[]');
      
      const targetId = String(id).trim();
      console.log(`[DataService] Request to delete ID: "${targetId}"`);
      
      // Find index first to verify existence
      const index = data.findIndex((item: Transaction) => String(item.id).trim() === targetId);

      if (index === -1) {
          console.error(`[DataService] ERROR: ID "${targetId}" NOT FOUND in storage.`);
          console.log(`[DataService] Available IDs:`, data.map((t: Transaction) => t.id));
          return;
      }
      
      // Remove item
      const updated = [...data];
      updated.splice(index, 1);
      
      console.log(`[DataService] ID "${targetId}" removed. Remaining count: ${updated.length}`);
      
      // Persist
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
      
      // Notify
      notify('transactions', updated);
      
    } catch (e) {
      console.error("[DataService] Failed to delete transaction", e);
    }
  },

  // --- BUDGETS ---
  subscribeBudgets: (callback: (data: MonthlyBudget[]) => void) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
    callback(data);
    listeners.budgets.push(callback);
    return () => { listeners.budgets = listeners.budgets.filter(cb => cb !== callback); };
  },

  setBudget: async (month: string, category: Category, amount: number) => {
    const data: MonthlyBudget[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
    let monthBudget = data.find(b => b.month === month);
    
    if (!monthBudget) {
      monthBudget = { month, categories: {} };
      data.push(monthBudget);
    }
    
    monthBudget.categories[category] = amount;
    
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(data));
    notify('budgets', data);
  },

  // --- SAVINGS ---
  subscribeSavings: (callback: (data: SavingsProject[]) => void) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS) || '[]');
    callback(data);
    listeners.savings.push(callback);
    return () => { listeners.savings = listeners.savings.filter(cb => cb !== callback); };
  },

  addSavingsProject: async (project: Omit<SavingsProject, 'id'>) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS) || '[]');
    const newP = { ...project, id: generateUUID() };
    const updated = [...data, newP];
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(updated));
    notify('savings', updated);
  },

  updateSavingsProject: async (project: SavingsProject) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS) || '[]');
    const updated = data.map((item: SavingsProject) => String(item.id).trim() === String(project.id).trim() ? project : item);
    localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(updated));
    notify('savings', updated);
  },
  
  deleteSavingsProject: async (id: string) => {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVINGS) || '[]');
        const updated = data.filter((item: SavingsProject) => String(item.id).trim() !== String(id).trim());
        localStorage.setItem(STORAGE_KEYS.SAVINGS, JSON.stringify(updated));
        notify('savings', updated);
    } catch (e) {
        console.error("[DataService] Failed to delete savings project", e);
    }
  }
};

// --- USER PROFILE SERVICE ---
export const UserService = {
    // Get current user profile
    getProfile: async (): Promise<UserProfile> => {
        const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (raw) return JSON.parse(raw);
        
        // Fallback (should be handled by init, but safe to have)
        const newProfile: UserProfile = {
            id: generateUUID(),
            theme: 'indigo',
            viewers: []
        };
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(newProfile));
        return newProfile;
    },

    updateTheme: async (theme: ThemeColor) => {
        const profile = await UserService.getProfile();
        profile.theme = theme;
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        // We might want to notify specific profile listeners if we added them
        return profile;
    },

    addViewer: async (viewerId: string) => {
        const profile = await UserService.getProfile();
        if (!profile.viewers.includes(viewerId)) {
            profile.viewers.push(viewerId);
            localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
        }
        return profile;
    }
};
