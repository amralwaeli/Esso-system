import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import type { PurchaseRequest } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { storage } from '../../lib/storage';

export function BillsTab() {
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = storage.getSettings();

  useEffect(() => {
    fetchPurchasedBills();
  }, []);

  const fetchPurchasedBills = async () => {
    try {
      const q = query(collection(db, 'purchase_requests'), where('status', '==', 'purchased'));
      const snap = await getDocs(q);
      const bills = snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt: raw.createdAt?.toDate?.().toISOString() || raw.createdAt || new Date().toISOString(),
          updatedAt: raw.updatedAt?.toDate?.().toISOString() || raw.updatedAt || new Date().toISOString(),
        } as PurchaseRequest;
      });
      setPurchases(bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error('Failed to load purchase bills', err);
      setError('Could not load purchase bills. Check Firebase rules and configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center py-8">Loading purchase bills...</p>;
  if (error) return <p className="text-center py-8 text-red-600">{error}</p>;

  const totalSpent = purchases.reduce((sum, p) => sum + (p.totalCost || 0), 0);
  const getBillItemsLabel = (bill: PurchaseRequest) => {
    if (bill.items?.length) {
      return bill.items.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ');
    }

    return bill.ingredientId;
  };

  const getBillQtyLabel = (bill: PurchaseRequest) => {
    if (bill.items?.length) return `${bill.items.length} item${bill.items.length === 1 ? '' : 's'}`;
    return `${bill.quantity} ${bill.unit}`;
  };

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
              <TableHead>Items</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Requested By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map(req => (
              <TableRow key={req.id}>
                <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{getBillItemsLabel(req)}</TableCell>
                <TableCell>{getBillQtyLabel(req)}</TableCell>
                <TableCell>{req.supplier || '-'}</TableCell>
                <TableCell>{req.invoiceNumber || '-'}</TableCell>
                <TableCell className="font-medium text-red-600">
                  {settings.currency} {(req.totalCost || 0).toFixed(2)}
                </TableCell>
                <TableCell>{req.createdBy}</TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
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
