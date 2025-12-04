import { Transaction, Frequency, Category, MonthlyBudget } from './types';
import { read, utils } from 'xlsx';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatTime = (time24: string): string => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

export const generateUUID = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// --- Calendar Logic ---
export const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// --- Spending Logic ---
export const getMTDSpending = (transactions: Transaction[], year: number, month: number) => {
    return transactions
        .filter(t => {
            const [tYear, tMonth] = t.date.split('-').map(Number);
            return tYear === year && (tMonth - 1) === month;
        })
        .reduce((sum, t) => sum + t.amount, 0);
};

export const getPriorMonthSpending = (transactions: Transaction[]) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth();
    
    return transactions
        .filter(t => {
            const [tYear, tMonth] = t.date.split('-').map(Number);
            return tYear === year && (tMonth - 1) === month;
        })
        .reduce((sum, t) => sum + t.amount, 0);
};

export const getCurrentMonthBudgetTotal = (budgets: MonthlyBudget[]) => {
    const now = new Date().toISOString().slice(0, 7); // YYYY-MM
    const current = budgets.find(b => b.month === now);
    if (!current) return 0;
    return Object.values(current.categories).reduce((sum, val) => sum + (val || 0), 0);
};

// --- Chart Data Helper ---
export const getCumulativeMTD = (transactions: Transaction[]) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Filter for current month using safe string parsing
    const currentTxns = transactions.filter(t => {
        const [tYear, tMonth] = t.date.split('-').map(Number);
        return tYear === year && (tMonth - 1) === month;
    });

    const dailyMap = new Map<number, number>();
    currentTxns.forEach(t => {
        const [_, __, tDay] = t.date.split('-').map(Number);
        dailyMap.set(tDay, (dailyMap.get(tDay) || 0) + t.amount);
    });

    const data = [];
    let runningTotal = 0;

    // Generate data for ALL days in the month
    for (let i = 1; i <= daysInMonth; i++) {
        runningTotal += dailyMap.get(i) || 0;
        data.push({ day: i, amount: runningTotal });
    }
    return data;
};

// Robust Parser using SheetJS
export const parseData = (buffer: ArrayBuffer): Partial<Transaction>[] => {
  try {
    const wb = read(buffer, { type: 'array', cellDates: true });
    if (!wb.SheetNames.length) return [];
    
    const ws = wb.Sheets[wb.SheetNames[0]];
    const jsonData = utils.sheet_to_json(ws);
    const transactions: Partial<Transaction>[] = [];

    jsonData.forEach((row: any) => {
      const normalizedRow: any = {};
      Object.keys(row).forEach(key => {
        normalizedRow[key.trim().toLowerCase()] = row[key];
      });

      const dateVal = normalizedRow['date'];
      const descVal = normalizedRow['description'] || normalizedRow['desc'];
      const amtVal = normalizedRow['amount'] || normalizedRow['cost'];
      const catVal = normalizedRow['category'];
      
      let dateStr = '';
      let timeStr = '';

      if (dateVal instanceof Date) {
          dateStr = dateVal.toISOString().split('T')[0];
          // Attempt to extract time if not midnight
          const h = dateVal.getHours();
          const m = dateVal.getMinutes();
          if (h !== 0 || m !== 0) {
             timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          }
      } else if (dateVal) {
           const d = new Date(dateVal);
           if (!isNaN(d.getTime())) {
               dateStr = d.toISOString().split('T')[0];
           }
      }

      let cat = Category.OTHER;
      if (catVal && typeof catVal === 'string') {
          const rowCatUpper = catVal.toUpperCase().trim();
          Object.values(Category).forEach(c => {
              if (c.toUpperCase() === rowCatUpper) cat = c;
          });
      }

      if (dateStr && amtVal) {
        transactions.push({
          date: dateStr,
          time: timeStr || undefined,
          description: descVal || 'Imported',
          amount: typeof amtVal === 'number' ? Math.abs(amtVal) : parseFloat(amtVal),
          category: cat,
          type: Frequency.ONE_TIME
        });
      }
    });
    
    return transactions;
  } catch (e) {
    console.error("Error parsing file:", e);
    return [];
  }
};