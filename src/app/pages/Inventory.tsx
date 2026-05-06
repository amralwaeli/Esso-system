import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LogOut, AlertTriangle, ShoppingCart, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { addIngredient, getIngredients, updateIngredientStock, getLowStockAlerts } from '../lib/firebase/ingredients';
import { getMyPurchaseRequests, getPendingPurchaseRequests, createPurchaseRequest, updatePurchaseRequestStatus, updateRequestToPurchased } from '../lib/firebase/purchases';
import type { Ingredient, PurchaseRequest } from '../types';

const emptyIngredientForm = {
  name: '',
  unit: 'kg' as Ingredient['unit'],
  currentStock: '',
  minStock: '',
};

export function Inventory() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pending, setPending] = useState<PurchaseRequest[]>([]);
  const [myRequests, setMyRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [ingredientForm, setIngredientForm] = useState(emptyIngredientForm);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [requestQuantity, setRequestQuantity] = useState('');
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [purchaseCost, setPurchaseCost] = useState('');
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseInvoice, setPurchaseInvoice] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'kitchen' | 'logistics'>(
    staff?.role === 'logistics' ? 'logistics' : 'kitchen'
  );

  useEffect(() => {
    if (!staff || !['inventory', 'logistics'].includes(staff.role)) {
      navigate('/');
    } else if (staff.role === 'inventory') {
      setActiveTab('kitchen');
      loadKitchen();
    } else {
      setActiveTab('logistics');
      loadLogistics();
    }
  }, [staff, navigate]);

  const loadKitchen = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ingredientRows, requestRows] = await Promise.all([
        getIngredients(),
        staff ? getMyPurchaseRequests(staff.name, 20) : Promise.resolve([]),
      ]);
      setIngredients(ingredientRows);
      setMyRequests(requestRows);
    } catch (err) {
      console.error('Failed to load inventory data', err);
      setError('Could not load inventory data. Check Firebase rules and configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = async () => {
    const currentStock = parseFloat(ingredientForm.currentStock);
    const minStock = parseFloat(ingredientForm.minStock);

    if (!ingredientForm.name.trim() || !Number.isFinite(currentStock) || !Number.isFinite(minStock) || currentStock < 0 || minStock < 0) {
      toast.error('Enter ingredient name, current stock, and minimum stock');
      return;
    }

    try {
      await addIngredient({
        name: ingredientForm.name.trim(),
        unit: ingredientForm.unit,
        currentStock,
        minStock,
        isActive: true,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Ingredient added');
      setIngredientForm(emptyIngredientForm);
      setIngredientDialogOpen(false);
      loadKitchen();
    } catch (err) {
      console.error('Failed to add ingredient', err);
      toast.error('Could not add ingredient');
    }
  };

  const loadLogistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ requests }, lowStockAlerts, ingredientRows] = await Promise.all([
        getPendingPurchaseRequests(20),
        getLowStockAlerts(),
        getIngredients(),
      ]);
      const ingredientNames = new Map(ingredientRows.map(ingredient => [ingredient.id, ingredient.name]));
      setPending(requests);
      setAlerts(lowStockAlerts.map(alert => ({
        ...alert,
        ingredientName: ingredientNames.get(alert.ingredientId) || alert.ingredientId,
      })));
    } catch (err) {
      console.error('Failed to load logistics inventory data', err);
      setError('Could not load inventory data. Check Firebase rules and configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (id: string, newStock: number) => {
    const ing = ingredients.find(i => i.id === id);
    if (!ing) return;
    try {
      await updateIngredientStock(id, newStock, ing.minStock);
      toast.success('Stock updated');
      loadKitchen();
    } catch (err) {
      console.error('Failed to update stock', err);
      toast.error('Could not update stock');
    }
  };

  const createRequest = async () => {
    const quantity = parseFloat(requestQuantity);

    if (!staff || !selectedIngredient || !Number.isFinite(quantity) || quantity <= 0) {
      toast.error('Enter a valid request quantity');
      return;
    }

    try {
      await createPurchaseRequest({
        ingredientId: selectedIngredient.name,
        quantity,
        unit: selectedIngredient.unit,
        status: 'pending',
        createdBy: staff.name,
      });
      toast.success('Request sent to Logistics');
      resetRequestDialog();
      loadKitchen();
    } catch (err) {
      console.error('Failed to create purchase request', err);
      toast.error('Could not create request');
    }
  };

  const openRequestDialog = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setRequestQuantity('');
    setRequestDialogOpen(true);
  };

  const resetRequestDialog = () => {
    setSelectedIngredient(null);
    setRequestQuantity('');
    setRequestDialogOpen(false);
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updatePurchaseRequestStatus(id, status);
      toast.success(`Status: ${status}`);
      loadLogistics();
    } catch (err) {
      console.error('Failed to update request status', err);
      toast.error('Could not update request');
    }
  };

  const markPurchased = async () => {
    const totalCost = parseFloat(purchaseCost);
    if (!selectedRequestId || !Number.isFinite(totalCost) || totalCost <= 0) {
      toast.error('Enter a valid purchase cost');
      return;
    }

    try {
      await updateRequestToPurchased(selectedRequestId, totalCost, {
        supplier: purchaseSupplier.trim() || undefined,
        invoiceNumber: purchaseInvoice.trim() || undefined,
        notes: purchaseNotes.trim() || undefined,
      });
      toast.success('Purchase bill recorded');
      resetPurchaseDialog();
      loadLogistics();
    } catch (err) {
      console.error('Failed to mark request purchased', err);
      toast.error('Could not record purchase bill');
    }
  };

  const resetPurchaseDialog = () => {
    setPurchaseDialogOpen(false);
    setSelectedRequestId(null);
    setPurchaseCost('');
    setPurchaseSupplier('');
    setPurchaseInvoice('');
    setPurchaseNotes('');
  };

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#fef6f3]">
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#d4622e]">
            {staff.role === 'inventory' ? 'Kitchen Inventory' : 'Logistics Dashboard'}
          </h1>
          <Button variant="ghost" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loading && <div className="p-8 text-center">Loading inventory...</div>}
        {error && <div className="p-8 text-center text-red-600">{error}</div>}
        {!loading && !error && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            {staff.role === 'inventory' && <TabsTrigger value="kitchen">Kitchen</TabsTrigger>}
            {staff.role === 'logistics' && <TabsTrigger value="logistics">Logistics</TabsTrigger>}
          </TabsList>

          <TabsContent value="kitchen" className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Ingredient Stock</h2>
                <Dialog open={ingredientDialogOpen} onOpenChange={(open) => {
                  setIngredientDialogOpen(open);
                  if (!open) setIngredientForm(emptyIngredientForm);
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Ingredient</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input value={ingredientForm.name} onChange={e => setIngredientForm(current => ({ ...current, name: e.target.value }))} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Unit</Label>
                        <Select value={ingredientForm.unit} onValueChange={(value) => setIngredientForm(current => ({ ...current, unit: value as Ingredient['unit'] }))}>
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
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Current Stock</Label>
                          <Input type="number" min="0" step="0.01" value={ingredientForm.currentStock} onChange={e => setIngredientForm(current => ({ ...current, currentStock: e.target.value }))} />
                        </div>
                        <div className="grid gap-2">
                          <Label>Minimum Stock</Label>
                          <Input type="number" min="0" step="0.01" value={ingredientForm.minStock} onChange={e => setIngredientForm(current => ({ ...current, minStock: e.target.value }))} />
                        </div>
                      </div>
                      <Button onClick={handleAddIngredient}>Save Ingredient</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Current</TableHead><TableHead>Min</TableHead><TableHead>Update Stock</TableHead><TableHead>Request</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ingredients.map(ing => (
                    <TableRow key={ing.id}>
                      <TableCell>{ing.name}</TableCell>
                      <TableCell>{ing.currentStock} {ing.unit}</TableCell>
                      <TableCell>{ing.minStock}</TableCell>
                      <TableCell>
                        <Input type="number" className="w-24" defaultValue={ing.currentStock}
                          onBlur={e => handleStockUpdate(ing.id, Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => openRequestDialog(ing)}>
                          <Plus className="mr-1 h-4 w-4" /> Request
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ingredients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">Add your first ingredient to start tracking stock</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">Purchase Requests Sent</h2>
              <Table>
                <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Qty</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {myRequests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell>{req.ingredientId}</TableCell>
                      <TableCell>{req.quantity} {req.unit}</TableCell>
                      <TableCell className="capitalize">{req.status}</TableCell>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {myRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No purchase requests sent yet</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <Dialog open={requestDialogOpen} onOpenChange={(open) => {
              setRequestDialogOpen(open);
              if (!open) resetRequestDialog();
            }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Purchase Request</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-1">
                    <Label>Ingredient</Label>
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                      {selectedIngredient?.name || '-'} {selectedIngredient ? `(${selectedIngredient.unit})` : ''}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantity Needed</Label>
                    <Input type="number" min="0" step="0.01" value={requestQuantity} onChange={e => setRequestQuantity(e.target.value)} />
                  </div>
                  <Button onClick={createRequest}>Send Request to Logistics</Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="logistics" className="grid gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500"/> Low Stock Alerts</h2>
              <Table>
                <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Current</TableHead><TableHead>Minimum</TableHead></TableRow></TableHeader>
                <TableBody>
                  {alerts.map(a => (
                    <TableRow key={a.ingredientId}>
                      <TableCell>{a.ingredientName}</TableCell>
                      <TableCell>{a.currentStock}</TableCell>
                      <TableCell>{a.minStock}</TableCell>
                    </TableRow>
                  ))}
                  {alerts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">No low stock alerts</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Pending Requests (Max 20)</h2>
              <Table>
                <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pending.map(req => (
                    <TableRow key={req.id}>
                      <TableCell>{req.ingredientId}</TableCell>
                      <TableCell>{req.quantity}</TableCell>
                      <TableCell>{req.unit}</TableCell>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(req.id, 'approved')}><Check className="h-4 w-4"/></Button>
                        <Dialog open={purchaseDialogOpen && selectedRequestId === req.id} onOpenChange={(open) => {
                          setPurchaseDialogOpen(open);
                          if (open) setSelectedRequestId(req.id);
                          else resetPurchaseDialog();
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="secondary">Add Bill</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Record Purchase Bill</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Total Cost</Label>
                                <Input type="number" min="0" step="0.01" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                  <Label>Supplier</Label>
                                  <Input value={purchaseSupplier} onChange={e => setPurchaseSupplier(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Invoice Number</Label>
                                  <Input value={purchaseInvoice} onChange={e => setPurchaseInvoice(e.target.value)} />
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label>Notes</Label>
                                <Textarea value={purchaseNotes} onChange={e => setPurchaseNotes(e.target.value)} />
                              </div>
                              <Button onClick={markPurchased}>Record Bill</Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(req.id, 'rejected')}><X className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pending.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No pending requests</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
}
