import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import type { PurchaseRequest } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { storage } from '../../lib/storage';

export function BillsTab() {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const settings = storage.getSettings();

  useEffect(() => {
    fetchPurchasedBills();
  }, []);

  const fetchPurchasedBills = async () => {
    const q = query(
      collection(db, 'purchase_requests'),
      where('status', '==', 'purchased'),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    setPurchases(snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate().toISOString() || new Date().toISOString(),
    })) as PurchaseRequest[]);
    setLoading(false);
  };

  if (loading) return <p className="text-center py-8">Loading purchase bills...</p>;

  const totalSpent = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Bills (Expenses)</CardTitle>
        <CardDescription>Track ingredient purchases & total spend</CardDescription>
        <div className="mt-2 text-lg font-semibold text-[#d4622e]">
          Total Spent: {settings.currency} {totalSpent.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ingredient ID</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Requested By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map(req => (
              <TableRow key={req.id}>
                <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{req.ingredientId}</TableCell>
                <TableCell>{req.quantity}</TableCell>
                <TableCell>{req.unit}</TableCell>
                <TableCell className="font-medium text-red-600">
                  {settings.currency} {(req.totalCost || 0).toFixed(2)}
                </TableCell>
                <TableCell>{req.createdBy}</TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No purchase records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}