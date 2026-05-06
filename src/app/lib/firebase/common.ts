import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { Category, PaymentMethod, Settings } from '../../types';
import { cache, CACHE_TTL } from '../cache';

export async function getCategories(): Promise<Category[]> {
  const cached = cache.get<Category[]>('categories');
  if (cached) return cached;

  const snapshot = await getDocs(collection(db, 'categories'));
  const categories = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Category[];

  cache.set('categories', categories, CACHE_TTL.CATEGORIES);
  return categories;
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<void> {
  const docRef = doc(collection(db, 'categories'));
  await setDoc(docRef, category);
  cache.invalidate('categories');
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  await updateDoc(doc(db, 'categories', id), updates);
  cache.invalidate('categories');
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id));
  cache.invalidate('categories');
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const cached = cache.get<PaymentMethod[]>('paymentMethods');
  if (cached) return cached;

  const snapshot = await getDocs(collection(db, 'payment_methods'));
  const methods = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as PaymentMethod[];

  cache.set('paymentMethods', methods, CACHE_TTL.PAYMENT_METHODS);
  return methods;
}

export async function addPaymentMethod(method: Omit<PaymentMethod, 'id'>): Promise<void> {
  const docRef = doc(collection(db, 'payment_methods'));
  await setDoc(docRef, method);
  cache.invalidate('paymentMethods');
}

export async function updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): Promise<void> {
  await updateDoc(doc(db, 'payment_methods', id), updates);
  cache.invalidate('paymentMethods');
}

export async function getSettings(): Promise<Settings> {
  const cached = cache.get<Settings>('settings');
  if (cached) return cached;

  const docRef = doc(db, 'settings', 'config');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    const defaultSettings: Settings = {
      currency: 'MYR',
      taxRate: 6,
      openingTime: '09:00',
      closingTime: '22:00',
      shiftDurationHours: 8,
      billLockHours: 5,
      businessName: 'My Business',
      businessAddress: '',
      businessPhone: '',
    };
    await setDoc(docRef, defaultSettings);
    cache.set('settings', defaultSettings, CACHE_TTL.SETTINGS);
    return defaultSettings;
  }

  const settings = docSnap.data() as Settings;
  cache.set('settings', settings, CACHE_TTL.SETTINGS);
  return settings;
}

export async function updateSettings(settings: Settings): Promise<void> {
  await setDoc(doc(db, 'settings', 'config'), settings);
  cache.invalidate('settings');
}
