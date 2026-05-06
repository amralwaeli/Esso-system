import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { DailySales } from '../../types';

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
  const purchasesQ = query(
    collection(db, 'purchase_requests'),
    where('status', '==', 'purchased'),
    where('createdAt', '>=', Timestamp.fromDate(new Date(startDate))),
    where('createdAt', '<=', Timestamp.fromDate(new Date(endDate)))
  );
  const purchasesSnap = await getDocs(purchasesQ);
  let expenses = 0;
  purchasesSnap.forEach(d => { expenses += (d.data().totalCost || 0); });

  return { revenue, expenses, profit: revenue - expenses, orderCount: salesSnap.size, purchaseCount: purchasesSnap.size };
}
