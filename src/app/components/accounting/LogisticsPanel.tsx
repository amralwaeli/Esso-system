import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Check, DollarSign, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { createPurchaseBill, updateRequestToPurchased } from '../../lib/firebase/purchases';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import type { PurchaseRequest } from '../../types';

const emptyBillForm = {
  ingredientId: '',
  quantity: '',
  unit: '',
  totalCost: '',
  supplier: '',
  invoiceNumber: '',
  notes: '',
};

export function LogisticsPanel() {
  const { staff } = useAuth();
  const settings = storage.getSettings();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [purchased, setPurchased] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [costInput, setCostInput] = useState<string>('');
  const [supplierInput, setSupplierInput] = useState<string>('');
  const [invoiceInput, setInvoiceInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [requestBillOpen, setRequestBillOpen] = useState(false);
  const [manualBillOpen, setManualBillOpen] = useState(false);
  const [manualBill, setManualBill] = useState(emptyBillForm);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [reqSnap, purSnap] = await Promise.all([
        getDocs(query(collection(db, 'purchase_requests'), where('status', 'in', ['pending', 'approved']))),
        getDocs(query(collection(db, 'purchase_requests'), where('status', '==', 'purchased'))),
      ]);

      const toRequest = (d: any) => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt: raw.createdAt?.toDate?.().toISOString() || raw.createdAt || new Date().toISOString(),
          updatedAt: raw.updatedAt?.toDate?.().toISOString() || raw.updatedAt || new Date().toISOString(),
        } as PurchaseRequest;
      };

      const sortNewest = (a: PurchaseRequest, b: PurchaseRequest) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

      setRequests(reqSnap.docs.map(toRequest).sort(sortNewest));
      setPurchased(purSnap.docs.map(toRequest).sort(sortNewest));
    } catch (err) {
      console.error('Failed to load logistics data', err);
      setError('Could not load logistics data. Check Firebase rules and configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBill = async () => {
    const totalCost = parseFloat(costInput);
    if (!selectedReqId || !Number.isFinite(totalCost) || totalCost <= 0) {
      toast.error('Enter a valid purchase cost');
      return;
    }

    try {
      await updateRequestToPurchased(selectedReqId, totalCost, {
        supplier: supplierInput.trim() || undefined,
        invoiceNumber: invoiceInput.trim() || undefined,
        notes: notesInput.trim() || undefined,
      });
      toast.success('Bill added and request marked as purchased');
      resetRequestBillForm();
      loadData();
    } catch (err) {
      console.error('Failed to add bill', err);
      toast.error('Could not add bill');
    }
  };

  const handleCreateManualBill = async () => {
    const quantity = parseFloat(manualBill.quantity);
    const totalCost = parseFloat(manualBill.totalCost);

    if (
      !manualBill.ingredientId.trim() ||
      !manualBill.unit.trim() ||
      !Number.isFinite(quantity) ||
      !Number.isFinite(totalCost) ||
      quantity <= 0 ||
      totalCost <= 0
    ) {
      toast.error('Enter ingredient, quantity, unit, and cost');
      return;
    }

    try {
      await createPurchaseBill({
        ingredientId: manualBill.ingredientId.trim(),
        quantity,
        unit: manualBill.unit.trim(),
        totalCost,
        supplier: manualBill.supplier.trim() || undefined,
        invoiceNumber: manualBill.invoiceNumber.trim() || undefined,
        notes: manualBill.notes.trim() || undefined,
        createdBy: staff?.name || 'Logistics',
      });
      toast.success('Purchase bill recorded');
      setManualBill(emptyBillForm);
      setManualBillOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to create manual purchase bill', err);
      toast.error('Could not record purchase bill');
    }
  };

  const resetRequestBillForm = () => {
    setCostInput('');
    setSupplierInput('');
    setInvoiceInput('');
    setNotesInput('');
    setSelectedReqId(null);
    setRequestBillOpen(false);
  };

  const updateManualBill = (field: keyof typeof emptyBillForm, value: string) => {
    setManualBill(current => ({ ...current, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

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
                  <TableHead>Ingredient</TableHead>
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
                      <Dialog open={requestBillOpen && selectedReqId === req.id} onOpenChange={(open) => {
                        setRequestBillOpen(open);
                        if (open) setSelectedReqId(req.id);
                        else resetRequestBillForm();
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm">
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
                              <Input type="number" min="0" step="0.01" placeholder="0.00" value={costInput} onChange={e => setCostInput(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                              <Label>Supplier</Label>
                              <Input value={supplierInput} onChange={e => setSupplierInput(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                              <Label>Invoice Number</Label>
                              <Input value={invoiceInput} onChange={e => setInvoiceInput(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                              <Label>Notes</Label>
                              <Textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} />
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
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Recorded Expenses</CardTitle>
            <Dialog open={manualBillOpen} onOpenChange={(open) => {
              setManualBillOpen(open);
              if (!open) setManualBill(emptyBillForm);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Purchase Bill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Purchase Bill</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Ingredient / Item</Label>
                    <Input value={manualBill.ingredientId} onChange={e => updateManualBill('ingredientId', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Quantity</Label>
                      <Input type="number" min="0" step="0.01" value={manualBill.quantity} onChange={e => updateManualBill('quantity', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Unit</Label>
                      <Input placeholder="kg, pcs, litre" value={manualBill.unit} onChange={e => updateManualBill('unit', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Total Cost</Label>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={manualBill.totalCost} onChange={e => updateManualBill('totalCost', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label>Supplier</Label>
                      <Input value={manualBill.supplier} onChange={e => updateManualBill('supplier', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Invoice Number</Label>
                      <Input value={manualBill.invoiceNumber} onChange={e => updateManualBill('invoiceNumber', e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea value={manualBill.notes} onChange={e => updateManualBill('notes', e.target.value)} />
                  </div>
                  <Button onClick={handleCreateManualBill}>Record Bill</Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Invoice</TableHead>
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
                    <TableCell>{req.supplier || '-'}</TableCell>
                    <TableCell>{req.invoiceNumber || '-'}</TableCell>
                    <TableCell className="font-bold text-red-600">{settings.currency} {(req.totalCost || 0).toFixed(2)}</TableCell>
                    <TableCell><Check className="h-4 w-4 text-green-500" /></TableCell>
                  </TableRow>
                ))}
                {purchased.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No purchase bills recorded</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
