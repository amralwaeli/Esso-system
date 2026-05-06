import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from './config';
import type { Shift } from '../../types';

const COLLECTION = 'shifts';

export async function getShifts(): Promise<Shift[]> {
  const q = query(collection(db, COLLECTION), orderBy('openedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    openedAt: doc.data().openedAt?.toDate().toISOString() || new Date().toISOString(),
    closedAt: doc.data().closedAt?.toDate()?.toISOString() || null,
  })) as Shift[];
}

export async function addShift(shift: Omit<Shift, 'id'>): Promise<string> {
  const batch = writeBatch(db);

  const shiftRef = doc(collection(db, COLLECTION));
  batch.set(shiftRef, {
    ...shift,
    openedAt: Timestamp.now(),
    closedAt: null,
  });

  const currentShiftRef = doc(db, 'current_shift', shift.staffId);
  batch.set(currentShiftRef, {
    shiftId: shiftRef.id,
    staffId: shift.staffId,
    openedAt: Timestamp.now(),
  });

  await batch.commit();
  return shiftRef.id;
}

export async function updateShift(id: string, updates: Partial<Shift>): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  const updateData: any = { ...updates };

  if (updates.closedAt) {
    updateData.closedAt = Timestamp.now();
  }

  await updateDoc(docRef, updateData);
}

export async function getCurrentShift(staffId: string): Promise<Shift | null> {
  const docRef = doc(db, 'current_shift', staffId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  const currentShiftData = docSnap.data();
  const shiftRef = doc(db, COLLECTION, currentShiftData.shiftId);
  const shiftSnap = await getDoc(shiftRef);

  if (!shiftSnap.exists()) return null;

  return {
    id: shiftSnap.id,
    ...shiftSnap.data(),
    openedAt: shiftSnap.data().openedAt?.toDate().toISOString() || new Date().toISOString(),
    closedAt: shiftSnap.data().closedAt?.toDate()?.toISOString() || null,
  } as Shift;
}

export async function clearCurrentShift(staffId: string): Promise<void> {
  await deleteDoc(doc(db, 'current_shift', staffId));
}

export async function closeShift(
  shiftId: string,
  staffId: string,
  closingData: { closingCash: number; expectedCash: number; difference: number; notes?: string }
): Promise<void> {
  const batch = writeBatch(db);

  const shiftRef = doc(db, COLLECTION, shiftId);
  batch.update(shiftRef, {
    ...closingData,
    closedAt: Timestamp.now(),
  });

  const currentShiftRef = doc(db, 'current_shift', staffId);
  batch.delete(currentShiftRef);

  await batch.commit();
}
