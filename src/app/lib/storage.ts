import type { Staff, Product, Category, PaymentMethod, Settings, Shift, Bill, InventoryMovement } from '../types';

const STORAGE_KEYS = {
  STAFF: 'pos_staff',
  PRODUCTS: 'pos_products',
  CATEGORIES: 'pos_categories',
  PAYMENT_METHODS: 'pos_payment_methods',
  SETTINGS: 'pos_settings',
  SHIFTS: 'pos_shifts',
  BILLS: 'pos_bills',
  INVENTORY_MOVEMENTS: 'pos_inventory_movements',
  CURRENT_SHIFT: 'pos_current_shift',
  INITIALIZED: 'pos_initialized',
};

export const storage = {
  // Staff
  getStaff: (): Staff[] => {
    const data = localStorage.getItem(STORAGE_KEYS.STAFF);
    return data ? JSON.parse(data) : [];
  },
  setStaff: (staff: Staff[]) => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staff));
  },
  addStaff: (staff: Staff) => {
    const allStaff = storage.getStaff();
    allStaff.push(staff);
    storage.setStaff(allStaff);
  },
  updateStaff: (id: string, updates: Partial<Staff>) => {
    const allStaff = storage.getStaff();
    const index = allStaff.findIndex(s => s.id === id);
    if (index !== -1) {
      allStaff[index] = { ...allStaff[index], ...updates };
      storage.setStaff(allStaff);
    }
  },

  // Products
  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  setProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },
  addProduct: (product: Product) => {
    const products = storage.getProducts();
    products.push(product);
    storage.setProducts(products);
  },
  updateProduct: (id: string, updates: Partial<Product>) => {
    const products = storage.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      storage.setProducts(products);
    }
  },
  deleteProduct: (id: string) => {
    const products = storage.getProducts().filter(p => p.id !== id);
    storage.setProducts(products);
  },

  // Categories
  getCategories: (): Category[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  },
  setCategories: (categories: Category[]) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },
  addCategory: (category: Category) => {
    const categories = storage.getCategories();
    categories.push(category);
    storage.setCategories(categories);
  },
  updateCategory: (id: string, updates: Partial<Category>) => {
    const categories = storage.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updates };
      storage.setCategories(categories);
    }
  },
  deleteCategory: (id: string) => {
    const categories = storage.getCategories().filter(c => c.id !== id);
    storage.setCategories(categories);
  },

  // Payment Methods
  getPaymentMethods: (): PaymentMethod[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
    return data ? JSON.parse(data) : [];
  },
  setPaymentMethods: (methods: PaymentMethod[]) => {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(methods));
  },
  addPaymentMethod: (method: PaymentMethod) => {
    const methods = storage.getPaymentMethods();
    methods.push(method);
    storage.setPaymentMethods(methods);
  },
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => {
    const methods = storage.getPaymentMethods();
    const index = methods.findIndex(m => m.id === id);
    if (index !== -1) {
      methods[index] = { ...methods[index], ...updates };
      storage.setPaymentMethods(methods);
    }
  },

  // Settings
  getSettings: (): Settings => {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : getDefaultSettings();
  },
  setSettings: (settings: Settings) => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Shifts
  getShifts: (): Shift[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    return data ? JSON.parse(data) : [];
  },
  setShifts: (shifts: Shift[]) => {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  },
  addShift: (shift: Shift) => {
    const shifts = storage.getShifts();
    shifts.push(shift);
    storage.setShifts(shifts);
  },
  updateShift: (id: string, updates: Partial<Shift>) => {
    const shifts = storage.getShifts();
    const index = shifts.findIndex(s => s.id === id);
    if (index !== -1) {
      shifts[index] = { ...shifts[index], ...updates };
      storage.setShifts(shifts);
    }
  },
  getCurrentShift: (): Shift | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT);
    return data ? JSON.parse(data) : null;
  },
  setCurrentShift: (shift: Shift | null) => {
    if (shift) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, JSON.stringify(shift));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT);
    }
  },

  // Bills
  getBills: (): Bill[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BILLS);
    return data ? JSON.parse(data) : [];
  },
  setBills: (bills: Bill[]) => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  },
  addBill: (bill: Bill) => {
    const bills = storage.getBills();
    bills.push(bill);
    storage.setBills(bills);
  },
  updateBill: (id: string, updates: Partial<Bill>) => {
    const bills = storage.getBills();
    const index = bills.findIndex(b => b.id === id);
    if (index !== -1) {
      bills[index] = { ...bills[index], ...updates };
      storage.setBills(bills);
    }
  },

  // Inventory Movements
  getInventoryMovements: (): InventoryMovement[] => {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY_MOVEMENTS);
    return data ? JSON.parse(data) : [];
  },
  setInventoryMovements: (movements: InventoryMovement[]) => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY_MOVEMENTS, JSON.stringify(movements));
  },
  addInventoryMovement: (movement: InventoryMovement) => {
    const movements = storage.getInventoryMovements();
    movements.push(movement);
    storage.setInventoryMovements(movements);
  },

  // Initialization
  isInitialized: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true';
  },
  setInitialized: () => {
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  },

  // Clear all data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};

function getDefaultSettings(): Settings {
  return {
    currency: 'MYR',
    taxRate: 6,
    openingTime: '09:00',
    closingTime: '22:00',
    shiftDurationHours: 8,
    billLockHours: 5,
    businessName: 'My Business',
    businessAddress: '',
    businessPhone: '',
  };
}

// Initialize with seed data
export function initializeSeedData() {
  if (storage.isInitialized()) return;

  // Seed default admin with PIN 9999
  const adminStaff: Staff = {
    id: '1',
    name: 'Admin',
    pin: '9999',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  storage.addStaff(adminStaff);

  // Seed categories
  const categories: Category[] = [
    { id: '1', name: 'Beverages', color: '#ef4444', order: 1 },
    { id: '2', name: 'Food', color: '#f59e0b', order: 2 },
    { id: '3', name: 'Desserts', color: '#ec4899', order: 3 },
    { id: '4', name: 'Snacks', color: '#8b5cf6', order: 4 },
  ];
  storage.setCategories(categories);

  // Seed payment methods
  const paymentMethods: PaymentMethod[] = [
    { id: '1', name: 'Cash', type: 'cash', isActive: true },
    { id: '2', name: 'QR Code', type: 'qr', isActive: true },
  ];
  storage.setPaymentMethods(paymentMethods);

  // Set default settings
  storage.setSettings(getDefaultSettings());

  storage.setInitialized();
}
