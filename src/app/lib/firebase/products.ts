import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, Timestamp, increment } from 'firebase/firestore';
import { db } from './config';
import type { Product } from '../../types';
import { cache, CACHE_TTL } from '../cache';

const COLLECTION = 'products';

export async function getProducts(): Promise<Product[]> {
  const cached = cache.get<Product[]>('products');
  if (cached) return cached;

  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  const products = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  })) as Product[];

  cache.set('products', products, CACHE_TTL.PRODUCTS);
  return products;
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<void> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...product,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  cache.invalidate('products');
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
  cache.invalidate('products');
}

export async function updateProductStock(id: string, quantityChange: number): Promise<void> {
  const docRef = doc(db, COLLECTION, id);
  await updateDoc(docRef, {
    stock: increment(quantityChange),
    updatedAt: Timestamp.now(),
  });

  const cached = cache.get<Product[]>('products');
  if (cached) {
    const updated = cached.map(p =>
      p.id === id ? { ...p, stock: p.stock + quantityChange } : p
    );
    cache.set('products', updated, CACHE_TTL.PRODUCTS);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
  cache.invalidate('products');
}
