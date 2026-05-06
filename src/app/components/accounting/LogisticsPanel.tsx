import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Check, DollarSign, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { updateRequestToPurchased } from '../../lib/firebase/purchases';
import type { PurchaseRequest } from '../../types';

export function LogisticsPanel() {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [purchased, setPurchased] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [costInput, setCostInput] = useState<string>('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Load Pending Requests
    const reqQ = query(collection(db, 'purchase_requests'), where('status', 'in', ['pending', 'approved']), orderBy('createdAt', 'desc'));
    const reqSnap = await getDocs(reqQ);
    setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseRequest)));

    // Load Purchased Bills
    const purQ = query(collection(db, 'purchase_requests'), where('status', '==', 'purchased'), orderBy('createdAt', 'desc'));
    const purSnap = await getDocs(purQ);
    setPurchased(purSnap.docs.map(d => ({ id: d.id, ...d.data() } as PurchaseRequest)));
    setLoading(false);
  };

  const handleAddBill = async () => {
    if (!selectedReqId || !costInput) return;
    await updateRequestToPurchased(selectedReqId, parseFloat(costInput));
    toast.success('Bill added and request marked as purchased');
    setCostInput('');
    setSelectedReqId(null);
    loadData();
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Tabs defaultValue="inventory">
      <TabsList className="mb-6">
        <TabsTrigger value="inventory">Kitchen Requests (Inventory)</TabsTrigger>
        <TabsTrigger value="bills">Purchase Bills</TabsTrigger>
      </TabsList>

      {/* TAB 1: Inventory / Requests */}
      <TabsContent value="inventory">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-amber-500" /> Pending Requests from Kitchen</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient ID</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{req.ingredientId}</TableCell>
                    <TableCell>{req.quantity}</TableCell>
                    <TableCell>{req.unit}</TableCell>
                    <TableCell>{req.createdBy}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedReqId(req.id)}>
                            <DollarSign className="h-4 w-4 mr-1" /> Add Bill
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Purchase Bill</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label>Cost / Price Paid</Label>
                              <Input type="number" placeholder="0.00" value={costInput} onChange={e => setCostInput(e.target.value)} />
                            </div>
                            <Button onClick={handleAddBill}>Confirm Purchase</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No pending requests</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB 2: Bills */}
      <TabsContent value="bills">
        <Card>
          <CardHeader><CardTitle>Recorded Expenses</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchased.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{req.ingredientId}</TableCell>
                    <TableCell>{req.quantity} {req.unit}</TableCell>
                    <TableCell className="font-bold text-red-600">${req.totalCost?.toFixed(2)}</TableCell>
                    <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}