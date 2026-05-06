import { collection, doc, getDocs, setDoc, updateDoc, query, where, limit, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { Staff } from '../../types';

const COLLECTION = 'staff';

export async function loginWithPin(pin: string): Promise<Staff | null> {
  const q = query(
    collection(db, COLLECTION),
    where('pin', '==', pin),
    where('isActive', '==', true),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
  } as Staff;
}

export async function getStaff(): Promise<Staff[]> {
  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
  })) as Staff[];
}

export async function addStaff(staff: Omit<Staff, 'id'>): Promise<void> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...staff,
    createdAt: Timestamp.now(),
  });
}

export async function updateStaff(id: string, updates: Partial<Staff>): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, updates);
}
