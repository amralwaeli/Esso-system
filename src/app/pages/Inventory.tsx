import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { LogOut, AlertTriangle, ShoppingCart, Check, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getIngredients, updateIngredientStock, getLowStockAlerts } from '../lib/firebase/ingredients';
import { getPendingPurchaseRequests, createPurchaseRequest, updatePurchaseRequestStatus } from '../lib/firebase/purchases';
import type { Ingredient, PurchaseRequest } from '../types';

export function Inventory() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pending, setPending] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'kitchen' | 'logistics'>(
    staff?.role === 'logistics' ? 'logistics' : 'kitchen'
  );

  useEffect(() => {
    if (!staff || !['inventory', 'logistics'].includes(staff.role)) navigate('/');
    else if (staff.role === 'inventory') loadKitchen();
    else loadLogistics();
  }, [staff, navigate]);

  const loadKitchen = async () => {
    setLoading(true);
    setError(null);
    try {
      setIngredients(await getIngredients());
    } catch (err) {
      console.error('Failed to load inventory data', err);
      setError('Could not load inventory data. Check Firebase rules and configuration.');
    } finally {
      setLoading(false);
    }
  };

  const loadLogistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ requests }, lowStockAlerts] = await Promise.all([
        getPendingPurchaseRequests(20),
        getLowStockAlerts(),
      ]);
      setPending(requests);
      setAlerts(lowStockAlerts);
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

  const createRequest = async (ingredientId: string, qty: number, unit: string) => {
    if (!staff) return;
    try {
      await createPurchaseRequest({ ingredientId, quantity: qty, unit, status: 'pending', createdBy: staff.name });
      toast.success('Request sent to Logistics');
    } catch (err) {
      console.error('Failed to create purchase request', err);
      toast.error('Could not create request');
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected' | 'purchased') => {
    try {
      await updatePurchaseRequestStatus(id, status);
      toast.success(`Status: ${status}`);
      loadLogistics();
    } catch (err) {
      console.error('Failed to update request status', err);
      toast.error('Could not update request');
    }
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
            <TabsTrigger value="kitchen" disabled={staff.role === 'logistics'}>Kitchen</TabsTrigger>
            <TabsTrigger value="logistics" disabled={staff.role === 'inventory'}>Logistics</TabsTrigger>
          </TabsList>

          <TabsContent value="kitchen" className="space-y-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">Ingredient Stock</h2>
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
                        <Button size="sm" variant="outline" onClick={() => createRequest(ing.id, 10, ing.unit)}>
                          <Plus className="mr-1 h-4 w-4" /> Request
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="logistics" className="grid gap-6">
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500"/> Low Stock Alerts</h2>
              <Table>
                <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Current</TableHead><TableHead>Minimum</TableHead></TableRow></TableHeader>
                <TableBody>
                  {alerts.map(a => (
                    <TableRow key={a.ingredientId}>
                      <TableCell>{a.ingredientId}</TableCell>
                      <TableCell>{a.currentStock}</TableCell>
                      <TableCell>{a.minStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-white p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Pending Requests (Max 20)</h2>
              <Table>
                <TableHeader><TableRow><TableHead>Qty</TableHead><TableHead>Unit</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pending.map(req => (
                    <TableRow key={req.id}>
                      <TableCell>{req.quantity}</TableCell>
                      <TableCell>{req.unit}</TableCell>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(req.id, 'approved')}><Check className="h-4 w-4"/></Button>
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(req.id, 'purchased')}>Mark Purchased</Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(req.id, 'rejected')}><X className="h-4 w-4"/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
