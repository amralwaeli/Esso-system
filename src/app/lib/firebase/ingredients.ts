import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, where, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from './config';
import type { Ingredient, LowStockAlert } from '../../types';
import { cache, CACHE_TTL } from '../cache';

const COLLECTION = 'ingredients';

export async function getIngredients(): Promise<Ingredient[]> {
  const cached = cache.get<Ingredient[]>('ingredients');
  if (cached) return cached;

  const q = query(collection(db, COLLECTION), where('isActive', '==', true));
  const snapshot = await getDocs(q);
  const ingredients = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  })) as Ingredient[];

  cache.set('ingredients', ingredients, CACHE_TTL.INGREDIENTS);
  return ingredients;
}

export async function addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<void> {
  const docRef = doc(collection(db, COLLECTION));
  await setDoc(docRef, {
    ...ingredient,
    updatedAt: Timestamp.now(),
  });
  cache.invalidate('ingredients');
}

export async function updateIngredientStock(
  id: string,
  newStock: number,
  minStock: number
): Promise<void> {
  const batch = writeBatch(db);

  const ingredientRef = doc(db, COLLECTION, id);
  batch.update(ingredientRef, {
    currentStock: newStock,
    updatedAt: Timestamp.now(),
  });

  const alertRef = doc(db, 'low_stock_alerts', id);

  if (newStock <= minStock) {
    batch.set(alertRef, {
      currentStock: newStock,
      minStock,
      updatedAt: Timestamp.now(),
    });
  } else {
    batch.delete(alertRef);
  }

  await batch.commit();

  cache.invalidate('ingredients');
}

export async function getLowStockAlerts(): Promise<LowStockAlert[]> {
  const snapshot = await getDocs(collection(db, 'low_stock_alerts'));
  return snapshot.docs.map(doc => ({
    ingredientId: doc.id,
    ...doc.data(),
    updatedAt: doc.data().updatedAt?.toDate().toISOString() || new Date().toISOString(),
  })) as LowStockAlert[];
}

export async function deleteIngredient(id: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTION, id));
  batch.delete(doc(db, 'low_stock_alerts', id));
  await batch.commit();
  cache.invalidate('ingredients');
}
