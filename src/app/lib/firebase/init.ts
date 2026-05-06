import { collection, doc, getDoc, setDoc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './config';

export async function initializeFirebase(): Promise<void> {
  const initDoc = doc(db, 'system', 'initialized');
  const initSnap = await getDoc(initDoc);

  if (initSnap.exists()) {
    return;
  }

  const batch = writeBatch(db);

  const adminStaffRef = doc(db, 'staff', 'default-admin');
  batch.set(adminStaffRef, {
    name: 'Admin',
    pin: '9999',
    role: 'admin',
    isActive: true,
    createdAt: Timestamp.now(),
  });

  const categories = [
    { id: 'beverages', name: 'Beverages', color: '#ef4444', order: 1 },
    { id: 'food', name: 'Food', color: '#f59e0b', order: 2 },
    { id: 'desserts', name: 'Desserts', color: '#ec4899', order: 3 },
    { id: 'snacks', name: 'Snacks', color: '#8b5cf6', order: 4 },
  ];

  categories.forEach(cat => {
    const catRef = doc(db, 'categories', cat.id);
    batch.set(catRef, cat);
  });

  const paymentMethods = [
    { id: 'cash', name: 'Cash', type: 'cash', isActive: true },
    { id: 'qr', name: 'QR Code', type: 'qr', isActive: true },
  ];

  paymentMethods.forEach(method => {
    const methodRef = doc(db, 'payment_methods', method.id);
    batch.set(methodRef, method);
  });

  const settingsRef = doc(db, 'settings', 'config');
  batch.set(settingsRef, {
    currency: 'MYR',
    taxRate: 6,
    openingTime: '09:00',
    closingTime: '22:00',
    shiftDurationHours: 8,
    billLockHours: 5,
    businessName: 'My Business',
    businessAddress: '',
    businessPhone: '',
  });

  batch.set(initDoc, { initialized: true, date: Timestamp.now() });

  await batch.commit();
}
