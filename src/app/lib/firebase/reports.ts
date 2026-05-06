import { collection, doc, query, where, getDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from './config';
import type { DailySales, PurchaseRequest } from '../../types';

export async function getDailySales(startDate: string, endDate: string): Promise<DailySales[]> {
  const q = query(
    collection(db, 'daily_sales'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    date: doc.id,
    ...doc.data(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  })) as DailySales[];
}

export async function getTodaySales(): Promise<DailySales | null> {
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'daily_sales', today);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return {
      date: today,
      sales: 0,
      orders: 0,
      cashSales: 0,
      qrSales: 0,
      cardSales: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    date: docSnap.id,
    ...docSnap.data(),
    updatedAt: docSnap.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  } as DailySales;
}
export async function getPandL(startDate: string, endDate: string) {
  // Revenue
  const salesQ = query(collection(db, 'daily_sales'), where('date', '>=', startDate), where('date', '<=', endDate));
  const salesSnap = await getDocs(salesQ);
  let revenue = 0;
  salesSnap.forEach(d => { revenue += (d.data().sales || 0); });

  // Expenses (Purchased ingredient requests)
  const purchasesQ = query(collection(db, 'purchase_requests'), where('status', '==', 'purchased'));
  const purchasesSnap = await getDocs(purchasesQ);
  let expenses = 0;
  purchasesSnap.forEach(d => {
    const createdAt = toDate(d.data().createdAt);
    if (createdAt >= new Date(startDate) && createdAt <= new Date(endDate)) {
      expenses += (d.data().totalCost || 0);
    }
  });

  return { revenue, expenses, profit: revenue - expenses, orderCount: salesSnap.size, purchaseCount: purchasesSnap.size };
}

export async function getFinancialReport(days: number = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // 1. Fetch Sales
  const salesQ = query(collection(db, 'daily_sales'), where('date', '>=', startDate.toISOString().split('T')[0]));
  const salesSnap = await getDocs(salesQ);
  let totalRevenue = 0;
  salesSnap.forEach(d => totalRevenue += (d.data().sales || 0));

  // 2. Fetch Expenses (Purchased Requests)
  const expensesQ = query(collection(db, 'purchase_requests'), where('status', '==', 'purchased'));
  const expensesSnap = await getDocs(expensesQ);
  let totalExpenses = 0;
  const recentExpenses: PurchaseRequest[] = [];
  expensesSnap.forEach(d => {
    const raw = d.data();
    const createdAt = toDate(raw.createdAt);
    if (createdAt >= startDate) {
      totalExpenses += (raw.totalCost || 0);
      recentExpenses.push({
        id: d.id,
        ...raw,
        createdAt: createdAt.toISOString(),
        updatedAt: toDate(raw.updatedAt).toISOString(),
      } as PurchaseRequest);
    }
  });

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    purchaseCount: recentExpenses.length,
    recentExpenses: recentExpenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    startDate,
    endDate
  };
}

function toDate(value: any): Date {
  if (value?.toDate) return value.toDate();
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date(0);
}
