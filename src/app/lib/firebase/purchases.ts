import { collection, doc, getDocs, setDoc, updateDoc, query, where, limit, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { PurchaseRequest } from '../../types';

const COLLECTION = 'purchase_requests';

type PurchaseRequestInput = Omit<PurchaseRequest, 'id' | 'createdAt' | 'updatedAt'>;
type PurchaseBillInput = Omit<PurchaseRequestInput, 'status' | 'source'>;

export async function getPendingPurchaseRequests(pageSize: number = 20): Promise<{ requests: PurchaseRequest[], lastDoc: any }> {
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'pending'),
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  } as PurchaseRequest))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    requests,
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  };
}

export async function createPurchaseRequest(request: PurchaseRequestInput): Promise<void> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...request,
    source: 'inventory_request',
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
    limit(pageSize)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  } as PurchaseRequest))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export async function createPurchaseBill(bill: PurchaseBillInput): Promise<void> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...bill,
    status: 'purchased',
    source: 'manual_bill',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateRequestToPurchased(
  id: string,
  cost: number,
  details: Pick<PurchaseRequest, 'supplier' | 'invoiceNumber' | 'notes'> = {}
): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    status: 'purchased',
    totalCost: cost,
    ...details,
    updatedAt: Timestamp.now(),
  });
}
