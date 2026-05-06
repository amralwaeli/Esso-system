import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import type { PaymentMethod } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Switch } from '../ui/switch';
import { Plus, CreditCard, Wallet, QrCode, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export function PaymentMethodsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash' as 'cash' | 'qr' | 'card' | 'other',
  });

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = () => {
    setMethods(storage.getPaymentMethods());
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Please enter a payment method name');
      return;
    }

    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      isActive: true,
    };
    storage.addPaymentMethod(newMethod);
    toast.success('Payment method added');

    loadMethods();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleToggle = (id: string, isActive: boolean) => {
    storage.updatePaymentMethod(id, { isActive: !isActive });
    loadMethods();
    toast.success(`Payment method ${isActive ? 'disabled' : 'enabled'}`);
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'cash' });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'cash': return <DollarSign className="h-5 w-5" />;
      case 'qr': return <QrCode className="h-5 w-5" />;
      case 'card': return <CreditCard className="h-5 w-5" />;
      default: return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage accepted payment methods</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>Create a new payment method</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Method Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Credit Card"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="qr">QR Code</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSubmit} className="w-full">Add Payment Method</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {methods.map((method) => (
            <div key={method.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#fef6f3] rounded-lg text-[#d4622e]">
                    {getIcon(method.type)}
                  </div>
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-[#7d7d7d] capitalize">{method.type}</p>
                  </div>
                </div>
                <Switch
                  checked={method.isActive}
                  onCheckedChange={() => handleToggle(method.id, method.isActive)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
