import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Check, DollarSign, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { createPurchaseBill, updateRequestToPurchased } from '../../lib/firebase/purchases';
import { storage } from '../../lib/storage';
import { useAuth } from '../../contexts/AuthContext';
import type { PurchaseRequest } from '../../types';

const emptyBillForm = {
  totalCost: '',
  supplier: '',
  invoiceNumber: '',
  notes: '',
};

const emptyBillItem = {
  name: '',
  quantity: '',
  unit: 'kg',
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
  const [manualBillItems, setManualBillItems] = useState([emptyBillItem]);

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
    const totalCost = parseFloat(manualBill.totalCost);
    const items = manualBillItems.map(item => ({
      name: item.name.trim(),
      quantity: parseFloat(item.quantity),
      unit: item.unit,
    }));

    if (
      !Number.isFinite(totalCost) ||
      totalCost <= 0
    ) {
      toast.error('Enter a valid bill total');
      return;
    }

    if (items.some(item => !item.name || !Number.isFinite(item.quantity) || item.quantity <= 0 || !item.unit)) {
      toast.error('Enter every item name, quantity, and unit');
      return;
    }

    try {
      await createPurchaseBill({
        ingredientId: items.length === 1 ? items[0].name : `${items.length} items`,
        quantity: items.length,
        unit: 'bill',
        items,
        totalCost,
        supplier: manualBill.supplier.trim() || undefined,
        invoiceNumber: manualBill.invoiceNumber.trim() || undefined,
        notes: manualBill.notes.trim() || undefined,
        createdBy: staff?.name || 'Logistics',
      });
      toast.success('Purchase bill recorded');
      resetManualBillForm();
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

  const updateManualBillItem = (index: number, field: keyof typeof emptyBillItem, value: string) => {
    setManualBillItems(current => current.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item
    ));
  };

  const addManualBillItem = () => {
    setManualBillItems(current => [...current, emptyBillItem]);
  };

  const removeManualBillItem = (index: number) => {
    setManualBillItems(current => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  };

  const resetManualBillForm = () => {
    setManualBill(emptyBillForm);
    setManualBillItems([emptyBillItem]);
    setManualBillOpen(false);
  };

  const getBillItemsLabel = (req: PurchaseRequest) => {
    if (req.items?.length) {
      return req.items.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ');
    }

    return req.ingredientId;
  };

  const getBillQtyLabel = (req: PurchaseRequest) => {
    if (req.items?.length) return `${req.items.length} item${req.items.length === 1 ? '' : 's'}`;
    return `${req.quantity} ${req.unit}`;
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
              if (!open) resetManualBillForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Purchase Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Add Purchase Bill</DialogTitle>
                </DialogHeader>
                <div className="grid max-h-[70vh] gap-5 overflow-y-auto py-4 pr-2">
                  <div className="grid gap-4 rounded-md border p-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                      <Label>Total Bill Cost</Label>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" value={manualBill.totalCost} onChange={e => updateManualBill('totalCost', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Notes</Label>
                      <Textarea value={manualBill.notes} onChange={e => updateManualBill('notes', e.target.value)} />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <Label>Items</Label>
                      <Button type="button" size="sm" variant="outline" onClick={addManualBillItem}>
                        <Plus className="mr-1 h-4 w-4" /> Add Item
                      </Button>
                    </div>
                    {manualBillItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-[1fr_120px_130px_40px]">
                        <div className="grid gap-2">
                          <Label>Item</Label>
                          <Input value={item.name} onChange={e => updateManualBillItem(index, 'name', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Quantity</Label>
                          <Input type="number" min="0" step="0.01" value={item.quantity} onChange={e => updateManualBillItem(index, 'quantity', e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Type</Label>
                          <Select value={item.unit} onValueChange={(value) => updateManualBillItem(index, 'unit', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="pcs">pcs</SelectItem>
                              <SelectItem value="litre">litre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="mt-7"
                          onClick={() => removeManualBillItem(index)}
                          disabled={manualBillItems.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
                  <TableHead>Items</TableHead>
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
                    <TableCell>{getBillItemsLabel(req)}</TableCell>
                    <TableCell>{getBillQtyLabel(req)}</TableCell>
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
