import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import type { Product, InventoryMovement, Staff } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryTabProps {
  staff: Staff;
}

export function InventoryTab({ staff }: InventoryTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    type: 'restock' as 'restock' | 'adjustment',
    quantity: '',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(storage.getProducts());
    setMovements(storage.getInventoryMovements().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const handleSubmit = () => {
    if (!formData.productId || !formData.quantity) {
      toast.error('Please fill all required fields');
      return;
    }

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    const quantityChange = parseInt(formData.quantity);
    const newStock = product.stock + quantityChange;

    if (newStock < 0) {
      toast.error('Insufficient stock for adjustment');
      return;
    }

    storage.updateProduct(product.id, { stock: newStock });

    const movement: InventoryMovement = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      type: formData.type,
      quantity: quantityChange,
      previousStock: product.stock,
      newStock,
      reason: formData.reason,
      createdBy: staff.name,
      createdAt: new Date().toISOString(),
    };

    storage.addInventoryMovement(movement);
    loadData();
    setIsDialogOpen(false);
    resetForm();
    toast.success('Inventory updated');
  };

  const resetForm = () => {
    setFormData({ productId: '', type: 'restock', quantity: '', reason: '' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>Restock products or make adjustments</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Movement
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inventory Movement</DialogTitle>
                  <DialogDescription>Add stock or make adjustments</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Select value={formData.productId} onValueChange={(value) => setFormData({ ...formData, productId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (Current: {product.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restock">Restock (Add)</SelectItem>
                        <SelectItem value="adjustment">Adjustment (+/-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">
                      Quantity {formData.type === 'adjustment' && '(use negative for decrease)'}
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder={formData.type === 'restock' ? '100' : '+/-100'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="New shipment, damaged goods, etc."
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full">Submit</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movement Log</CardTitle>
          <CardDescription>History of all inventory changes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Previous</TableHead>
                <TableHead>New</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(movement => (
                <TableRow key={movement.id}>
                  <TableCell>{new Date(movement.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{movement.productName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{movement.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {movement.quantity > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">+{movement.quantity}</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-red-600 font-medium">{movement.quantity}</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{movement.previousStock}</TableCell>
                  <TableCell className="font-medium">{movement.newStock}</TableCell>
                  <TableCell className="text-sm text-[#7d7d7d]">{movement.reason || '-'}</TableCell>
                  <TableCell>{movement.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
