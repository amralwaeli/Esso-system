export type UserRole = 'admin' | 'cashier' | 'accounting' | 'logistics' | 'inventory';

export interface Staff {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  salesCount: number; // ← Replaces stock
  image?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'qr' | 'card' | 'other';
  isActive: boolean;
}

export interface Settings {
  currency: string;
  taxRate: number;
  openingTime: string;
  closingTime: string;
  shiftDurationHours: number;
  billLockHours: number;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
}

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  difference?: number;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Bill {
  id: string;
  orderNumber: string;
  shiftId: string;
  staffId: string;
  staffName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethodId: string;
  paymentMethodName: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber?: string;
  createdAt: string;
  isLocked: boolean;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'restock' | 'adjustment' | 'sale';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface DailySummary {
  date: string;
  sales: number;
  orders: number;
  expenses: number;
  profit: number;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: 'kg' | 'pcs' | 'litre';
  currentStock: number;
  minStock: number;
  isActive: boolean;
  updatedAt: string;
}

export interface PurchaseRequest {
  id: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  items?: PurchaseBillItem[];
  status: 'pending' | 'approved' | 'rejected' | 'purchased';
  createdBy: string;
  supplier?: string;
  invoiceNumber?: string;
  notes?: string;
  source?: 'inventory_request' | 'manual_bill';
  totalCost?: number; // ← NEW: Logistics adds the price here
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseBillItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface LowStockAlert {
  ingredientId: string;
  currentStock: number;
  minStock: number;
  updatedAt: string;
}

export interface BillSummary {
  id: string;
  orderNumber: string;
  shiftId: string;
  staffId: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethodId: string;
  orderType: 'dine-in' | 'takeaway';
  tableNumber?: string;
  itemCount: number;
  createdAt: string;
  isLocked: boolean;
}

export interface BillDetails {
  id: string;
  items: OrderItem[];
}

export interface DailySales {
  date: string;
  sales: number;
  orders: number;
  cashSales: number;
  qrSales: number;
  cardSales: number;
  updatedAt: string;
}
