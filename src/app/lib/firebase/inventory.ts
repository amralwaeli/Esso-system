import { collection, doc, getDocs, setDoc, query, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { InventoryMovement } from '../../types';

const COLLECTION = 'inventory_movements';

export async function getInventoryMovements(pageSize: number = 50, lastDoc?: any): Promise<{ movements: InventoryMovement[], lastDoc: any }> {
  let q = query(
    collection(db, COLLECTION),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const movements = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
  })) as InventoryMovement[];

  return {
    movements,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  };
}

export async function addInventoryMovement(movement: Omit<InventoryMovement, 'id'>): Promise<void> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...movement,
    createdAt: Timestamp.now(),
  });
}
