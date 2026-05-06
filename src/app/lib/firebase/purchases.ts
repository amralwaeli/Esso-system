import { collection, doc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { PurchaseRequest } from '../../types';

const COLLECTION = 'purchase_requests';

export async function getPendingPurchaseRequests(pageSize: number = 20, lastDoc?: any): Promise<{ requests: PurchaseRequest[], lastDoc: any }> {
  let q = query(
    collection(db, COLLECTION),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  })) as PurchaseRequest[];

  return {
    requests,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  };
}

export async function createPurchaseRequest(request: Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...request,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updatePurchaseRequestStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected' | 'purchased'
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

export async function getMyPurchaseRequests(createdBy: string, pageSize: number = 20): Promise<PurchaseRequest[]> {
  const q = query(
    collection(db, COLLECTION),
    where('createdBy', '==', createdBy),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  })) as PurchaseRequest[];
}
