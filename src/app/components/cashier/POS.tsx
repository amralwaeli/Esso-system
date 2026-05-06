import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import type { Shift, Staff, Product, Category, PaymentMethod, OrderItem, Bill, InventoryMovement } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ShoppingCart, Plus, Minus, Trash2, DollarSign, Clock, X, Printer, Keyboard, Search } from 'lucide-react';
import { toast } from 'sonner';
import { printReceipt } from '../../lib/receipt';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface POSProps {
  shift: Shift;
  staff: Staff;
  onShiftEnd: () => void;
}

export function POS({ shift, staff, onShiftEnd }: POSProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('takeaway');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isEndShiftOpen, setIsEndShiftOpen] = useState(false);
  const [closingCash, setClosingCash] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  const settings = storage.getSettings();

  useKeyboardShortcuts({
    'ctrl+enter': () => cart.length > 0 && handleCheckout(),
    'ctrl+x': () => cart.length > 0 && clearCart(),
    'ctrl+d': () => setOrderType('dine-in'),
    'ctrl+t': () => setOrderType('takeaway'),
    'escape': () => setIsCheckoutOpen(false),
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(storage.getProducts().filter(p => p.isActive));
    setCategories(storage.getCategories());
    const methods = storage.getPaymentMethods().filter(m => m.isActive);
    setPaymentMethods(methods);
    if (methods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(methods[0].id);
    }
  };

  const filteredProducts = products
    .filter(p => selectedCategory === 'all' || p.categoryId === selectedCategory)
    .filter(p => searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      if (product.stock < 1) {
        toast.error('Out of stock');
        return;
      }
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    const item = cart.find(i => i.productId === productId);
    if (!product || !item) return;

    const newQuantity = item.quantity + delta;
    if (newQuantity <= 0) {
      setCart(cart.filter(i => i.productId !== productId));
    } else if (newQuantity > product.stock) {
      toast.error('Insufficient stock');
    } else {
      setCart(cart.map(i =>
        i.productId === productId
          ? { ...i, quantity: newQuantity, subtotal: newQuantity * i.price }
          : i
      ));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setTableNumber('');
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = cartSubtotal * (settings.taxRate / 100);
  const cartTotal = cartSubtotal + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (orderType === 'dine-in' && !tableNumber) {
      toast.error('Please enter table number');
      return;
    }
    if (!selectedPaymentMethod) {
      toast.error('Please select payment method');
      return;
    }

    const paymentMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (!paymentMethod) return;

    const bills = storage.getBills();
    const orderNumber = `ORD-${Date.now()}`;

    const newBill: Bill = {
      id: Date.now().toString(),
      orderNumber,
      shiftId: shift.id,
      staffId: staff.id,
      staffName: staff.name,
      items: cart,
      subtotal: cartSubtotal,
      tax: taxAmount,
      total: cartTotal,
      paymentMethodId: paymentMethod.id,
      paymentMethodName: paymentMethod.name,
      orderType,
      tableNumber: orderType === 'dine-in' ? tableNumber : undefined,
      createdAt: new Date().toISOString(),
      isLocked: false,
    };

    storage.addBill(newBill);

    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const newStock = product.stock - item.quantity;
        storage.updateProduct(product.id, { stock: newStock });

        const movement: InventoryMovement = {
          id: Date.now().toString() + item.productId,
          productId: product.id,
          productName: product.name,
          type: 'sale',
          quantity: -item.quantity,
          previousStock: product.stock,
          newStock,
          reason: `Order ${orderNumber}`,
          createdBy: staff.name,
          createdAt: new Date().toISOString(),
        };
        storage.addInventoryMovement(movement);
      }
    });

    toast.success(`Order ${orderNumber} completed`, {
      action: {
        label: 'Print Receipt',
        onClick: () => printReceipt(newBill, settings),
      },
    });
    clearCart();
    setIsCheckoutOpen(false);
    loadData();
  };

  const calculateShiftStats = () => {
    const bills = storage.getBills().filter(b => b.shiftId === shift.id);
    const cashSales = bills.filter(b => {
      const method = paymentMethods.find(m => m.id === b.paymentMethodId);
      return method?.type === 'cash';
    }).reduce((sum, b) => sum + b.total, 0);

    const expectedCash = shift.openingCash + cashSales;
    return { cashSales, expectedCash, totalOrders: bills.length };
  };

  const handleEndShift = () => {
    if (!closingCash || parseFloat(closingCash) < 0) {
      toast.error('Please enter valid closing cash amount');
      return;
    }

    const stats = calculateShiftStats();
    const closingAmount = parseFloat(closingCash);
    const difference = closingAmount - stats.expectedCash;

    storage.updateShift(shift.id, {
      closedAt: new Date().toISOString(),
      closingCash: closingAmount,
      expectedCash: stats.expectedCash,
      difference,
      notes: shiftNotes,
    });

    storage.setCurrentShift(null);

    const billLockTime = new Date(Date.now() + settings.billLockHours * 60 * 60 * 1000);
    const bills = storage.getBills().filter(b => b.shiftId === shift.id);
    bills.forEach(bill => {
      if (new Date() >= billLockTime) {
        storage.updateBill(bill.id, { isLocked: true });
      }
    });

    toast.success('Shift ended');
    onShiftEnd();
  };

  const stats = calculateShiftStats();

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Products</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowShortcuts(true)}>
                  <Keyboard className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEndShiftOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />
                  End Shift
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7d7d7d]" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="p-4 border-2 rounded-lg hover:border-[#d4622e] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={product.stock === 0}
                >
                  <p className="font-medium mb-1 line-clamp-2">{product.name}</p>
                  <p className="text-[#d4622e] font-bold">{settings.currency} {product.price.toFixed(2)}</p>
                  <p className="text-xs text-[#7d7d7d] mt-1">Stock: {product.stock}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={orderType === 'dine-in' ? 'default' : 'outline'}
                onClick={() => setOrderType('dine-in')}
                className="flex-1"
              >
                Dine In
              </Button>
              <Button
                variant={orderType === 'takeaway' ? 'default' : 'outline'}
                onClick={() => setOrderType('takeaway')}
                className="flex-1"
              >
                Takeaway
              </Button>
            </div>

            {orderType === 'dine-in' && (
              <div>
                <Label htmlFor="table">Table Number</Label>
                <Input
                  id="table"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g., T1"
                />
              </div>
            )}

            <Separator />

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center gap-2 p-2 bg-[#fef6f3] rounded">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productName}</p>
                    <p className="text-xs text-[#7d7d7d]">{settings.currency} {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.productId, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <Button size="sm" variant="ghost" onClick={() => updateQuantity(item.productId, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-medium text-sm w-16 text-right">{settings.currency} {item.subtotal.toFixed(2)}</p>
                  <Button size="sm" variant="ghost" onClick={() => removeFromCart(item.productId)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {cart.length === 0 && (
              <p className="text-center text-[#7d7d7d] py-8">Cart is empty</p>
            )}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{settings.currency} {cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({settings.taxRate}%)</span>
                <span>{settings.currency} {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#d4622e]">{settings.currency} {cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label>Payment Method</Label>
              <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={clearCart} disabled={cart.length === 0} className="flex-1">
                Clear
              </Button>
              <Button onClick={handleCheckout} disabled={cart.length === 0} className="flex-1">
                Checkout
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Shift Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#7d7d7d]">Opening Cash</span>
              <span className="font-medium">{settings.currency} {shift.openingCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7d7d7d]">Cash Sales</span>
              <span className="font-medium">{settings.currency} {stats.cashSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7d7d7d]">Expected Drawer</span>
              <span className="font-medium">{settings.currency} {stats.expectedCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7d7d7d]">Total Orders</span>
              <span className="font-medium">{stats.totalOrders}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEndShiftOpen} onOpenChange={setIsEndShiftOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Shift</DialogTitle>
            <DialogDescription>Count the cash drawer and close your shift</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#fef6f3] p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Opening Cash:</span>
                <span className="font-medium">{settings.currency} {shift.openingCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span className="font-medium">{settings.currency} {stats.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Expected Cash:</span>
                <span className="text-[#d4622e]">{settings.currency} {stats.expectedCash.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="closingCash">Closing Cash ({settings.currency})</Label>
              <Input
                id="closingCash"
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder="0.00"
              />
              {closingCash && (
                <p className={`text-sm mt-1 ${parseFloat(closingCash) - stats.expectedCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Difference: {settings.currency} {(parseFloat(closingCash) - stats.expectedCash).toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="Any issues or notes"
              />
            </div>

            <Button onClick={handleEndShift} className="w-full">
              End Shift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>Speed up your workflow with these shortcuts</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Checkout</span>
              <kbd className="px-2 py-1 bg-[#fef6f3] border rounded text-sm font-mono">Ctrl + Enter</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Clear Cart</span>
              <kbd className="px-2 py-1 bg-[#fef6f3] border rounded text-sm font-mono">Ctrl + X</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Dine In</span>
              <kbd className="px-2 py-1 bg-[#fef6f3] border rounded text-sm font-mono">Ctrl + D</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Takeaway</span>
              <kbd className="px-2 py-1 bg-[#fef6f3] border rounded text-sm font-mono">Ctrl + T</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Close Dialog</span>
              <kbd className="px-2 py-1 bg-[#fef6f3] border rounded text-sm font-mono">Esc</kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
