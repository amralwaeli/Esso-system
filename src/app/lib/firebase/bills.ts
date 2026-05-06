import { collection, doc, getDocs, setDoc, query, orderBy, limit, startAfter, where, writeBatch, Timestamp, increment, getDoc } from 'firebase/firestore';
import { db } from './config';
import type { Bill, BillSummary, BillDetails, OrderItem, Settings } from '../../types';
import { updateProductStock } from './products';
import { addInventoryMovement } from './inventory';

export async function getBillsSummary(pageSize: number = 20, lastDoc?: any): Promise<{ bills: BillSummary[], lastDoc: any }> {
  let q = query(
    collection(db, 'bills_summary'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const bills = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
  })) as BillSummary[];

  return {
    bills,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  };
}

export async function getBillDetails(billId: string): Promise<OrderItem[]> {
  const docRef = doc(db, 'bills_details', billId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return [];

  return (docSnap.data() as BillDetails).items || [];
}

export async function createBill(
  bill: Omit<Bill, 'id'>,
  staffName: string
): Promise<void> {
  const batch = writeBatch(db);

  const billId = doc(collection(db, 'bills_summary')).id;
  const date = new Date().toISOString().split('T')[0];

  const summary: Omit<BillSummary, 'id'> = {
    orderNumber: bill.orderNumber,
    shiftId: bill.shiftId,
    staffId: bill.staffId,
    subtotal: bill.subtotal,
    tax: bill.tax,
    total: bill.total,
    paymentMethodId: bill.paymentMethodId,
    orderType: bill.orderType,
    tableNumber: bill.tableNumber,
    itemCount: bill.items.length,
    createdAt: new Date().toISOString(),
    isLocked: false,
  };

  const details: BillDetails = {
    id: billId,
    items: bill.items,
  };

  batch.set(doc(db, 'bills_summary', billId), {
    ...summary,
    createdAt: Timestamp.now(),
  });

  batch.set(doc(db, 'bills_details', billId), details);

  const dailySalesRef = doc(db, 'daily_sales', date);
  const paymentMethod = await getDoc(doc(db, 'payment_methods', bill.paymentMethodId));
  const paymentType = paymentMethod.data()?.type || 'other';

  const salesIncrement: any = {
    sales: increment(bill.total),
    orders: increment(1),
    updatedAt: Timestamp.now(),
  };

  if (paymentType === 'cash') salesIncrement.cashSales = increment(bill.total);
  else if (paymentType === 'qr') salesIncrement.qrSales = increment(bill.total);
  else if (paymentType === 'card') salesIncrement.cardSales = increment(bill.total);

  batch.set(dailySalesRef, salesIncrement, { merge: true });

  for (const item of bill.items) {
    const productRef = doc(db, 'products', item.productId);
    batch.update(productRef, {
      stock: increment(-item.quantity),
      updatedAt: Timestamp.now(),
    });

    const movementRef = doc(collection(db, 'inventory_movements'));
    batch.set(movementRef, {
      productId: item.productId,
      type: 'sale',
      quantity: -item.quantity,
      previousStock: 0,
      newStock: 0,
      reason: `Order ${bill.orderNumber}`,
      createdBy: staffName,
      createdAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

export async function getBillsForShift(shiftId: string): Promise<BillSummary[]> {
  const q = query(
    collection(db, 'bills_summary'),
    where('shiftId', '==', shiftId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
  })) as BillSummary[];
}

export function calculateBillLockStatus(bill: BillSummary, shiftClosedAt: string | null, billLockHours: number): boolean {
  if (!shiftClosedAt) return false;
  const lockTime = new Date(shiftClosedAt).getTime() + (billLockHours * 3600000);
  return Date.now() >= lockTime;
}
