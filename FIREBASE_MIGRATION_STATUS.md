# Firebase Migration Status

## ✅ COMPLETED

### Firebase Infrastructure
- ✅ Firebase SDK installed
- ✅ Firebase config created (`src/app/lib/firebase/config.ts`)
- ✅ Client-side cache layer with TTL (`src/app/lib/cache.ts`)
- ✅ Types updated with `inventory` role and new interfaces

### Firebase Services Created
- ✅ `firebase/staff.ts` - Staff authentication and management
- ✅ `firebase/products.ts` - Products with caching (10min TTL)
- ✅ `firebase/bills.ts` - Split bills (summary/details) with daily sales aggregation
- ✅ `firebase/ingredients.ts` - Ingredients with low stock alert management
- ✅ `firebase/purchases.ts` - Purchase requests with pagination
- ✅ `firebase/common.ts` - Categories, payment methods, settings (all cached)
- ✅ `firebase/shifts.ts` - Shifts with current_shift tracking
- ✅ `firebase/inventory.ts` - Inventory movements with pagination (50/page)
- ✅ `firebase/reports.ts` - Daily sales aggregation for reports
- ✅ `firebase/init.ts` - Seed data initialization

### Optimizations Implemented
- ✅ Client cache with TTL (products: 10min, categories: 10min, settings: 30min, ingredients: 10min)
- ✅ Bills split into `bills_summary` (light) + `bills_details` (full items)
- ✅ Daily sales aggregation (`daily_sales/{date}`) - updates on checkout
- ✅ Batch writes for checkout (3 + 2*itemCount writes)
- ✅ Low stock alerts denormalization (separate collection)
- ✅ Pagination for bills (20/page), inventory movements (50/page), purchase requests (20/page)
- ✅ Current shift per staff (`current_shift/{staffId}`)
- ✅ Minimized document size (only IDs, no duplicated names)
- ✅ Index-friendly queries (createdAt, status, productId)
- ✅ Local state update after stock changes (no re-fetch)

### Components Updated to Firebase
- ✅ AuthContext - Uses Firebase authentication
- ✅ PinLock - Async login with Firebase + inventory role routing
- ✅ StaffTab - Firebase CRUD operations
- ✅ App.tsx - Firebase initialization

### New Features
- ✅ Inventory role added to types and routing
- ✅ Ingredient, PurchaseRequest, LowStockAlert types
- ✅ BillSummary, BillDetails split structure
- ✅ DailySales type for aggregation

## 🚧 PENDING (Need to Update)

### Components Still Using localStorage
- ❌ Admin/DashboardTab - Remove 5s polling, use Firebase + manual refresh
- ❌ Admin/ProductsTab - Use Firebase products service
- ❌ Admin/CategoriesTab - Use Firebase categories service
- ❌ Admin/PaymentMethodsTab - Use Firebase payment methods service
- ❌ Admin/SettingsTab - Use Firebase settings service + backup/restore
- ❌ Cashier/ShiftManager - Use Firebase shifts service
- ❌ Cashier/POS - Use Firebase for checkout with batch writes
- ❌ Accounting/BillsTab - Use Firebase bills_summary + pagination
- ❌ Accounting/InventoryTab - Use Firebase inventory movements + pagination
- ❌ Reports - Use Firebase daily_sales aggregates

### New Screens to Create
- ❌ Inventory/IngredientsTab - Manage ingredients, update stock
- ❌ Inventory/PurchaseRequestsTab - Create purchase requests
- ❌ Logistics/LowStockTab - View low stock alerts (read low_stock_alerts)
- ❌ Logistics/PurchaseRequestsTab - Approve/reject requests (already in Accounting, need update for logistics)

## 📊 DATABASE SCHEMA (Firestore)

### Collections Implemented
```
staff/
  - pin, name, role, isActive, createdAt

products/
  - name, price, categoryId, stock, lowStockThreshold, isActive, updatedAt

categories/
  - name, color, order

payment_methods/
  - name, type, isActive

settings/config
  - currency, taxRate, openingTime, closingTime, etc.

bills_summary/
  - orderNumber, shiftId, staffId, subtotal, tax, total, paymentMethodId
  - orderType, tableNumber, itemCount, createdAt, isLocked

bills_details/
  - items: [{productId, price, quantity, subtotal}]

daily_sales/{date}
  - sales, orders, cashSales, qrSales, cardSales, updatedAt

shifts/
  - staffId, openedAt, closedAt, openingCash, closingCash, expectedCash, difference, notes

current_shift/{staffId}
  - shiftId, staffId, openedAt

inventory_movements/
  - productId, type, quantity, previousStock, newStock, reason, createdBy, createdAt

ingredients/
  - name, unit, currentStock, minStock, isActive, updatedAt

purchase_requests/
  - ingredientId, quantity, unit, status, createdBy, createdAt, updatedAt

low_stock_alerts/{ingredientId}
  - currentStock, minStock, updatedAt

system/initialized
  - initialized: true, date
```

### Indexes Required (Add to Firebase Console)
```
staff:
  - (pin, isActive) ASC

products:
  - (isActive, categoryId) ASC
  - (stock, lowStockThreshold) ASC

shifts:
  - (staffId, closedAt) DESC
  - (closedAt) DESC

bills_summary:
  - (createdAt) DESC
  - (shiftId, createdAt) DESC
  - (isLocked, createdAt) DESC

inventory_movements:
  - (productId, createdAt) DESC
  - (createdAt) DESC

ingredients:
  - (isActive, currentStock) ASC

purchase_requests:
  - (status, createdAt) DESC
  - (ingredientId, status) DESC
```

## 🔥 NEXT STEPS

### Priority 1: Complete Core Component Migration
1. Update Admin/ProductsTab to use Firebase
2. Update Cashier/POS to use Firebase checkout with batch writes
3. Update Admin/DashboardTab to use Firebase + remove 5s polling
4. Update Accounting/BillsTab to use bills_summary + pagination

### Priority 2: Create Inventory Screens
1. Create Inventory page with tabs
2. Create IngredientsTab component
3. Create Purchase Requests tab for inventory role
4. Update Logistics page to show low stock alerts

### Priority 3: Optimize Remaining Components
1. Update Reports to use daily_sales aggregates
2. Update all components to use cached data
3. Remove all localStorage dependencies
4. Test pagination on all list views

### Priority 4: Firebase Setup
1. Create Firebase project
2. Add indexes in Firebase Console
3. Set up security rules
4. Add environment variables for Firebase config
5. Test with real Firebase backend

## 📝 MIGRATION GUIDE

### For Each Component:

1. **Import Firebase services** instead of localStorage
   ```ts
   // OLD
   import { storage } from '../../lib/storage';
   
   // NEW
   import { getProducts, addProduct } from '../../lib/firebase/products';
   ```

2. **Make functions async**
   ```ts
   // OLD
   const loadData = () => {
     const data = storage.getProducts();
     setProducts(data);
   };
   
   // NEW
   const loadData = async () => {
     const data = await getProducts(); // Uses cache first
     setProducts(data);
   };
   ```

3. **Check cache before fetch**
   - Products, categories, settings, ingredients, paymentMethods are cached
   - Cache is automatic in Firebase services
   - Invalidate cache after writes

4. **Use pagination for lists**
   ```ts
   const [lastDoc, setLastDoc] = useState<any>(null);
   
   const loadMore = async () => {
     const { bills, lastDoc: newLastDoc } = await getBillsSummary(20, lastDoc);
     setBills(prev => [...prev, ...bills]);
     setLastDoc(newLastDoc);
   };
   ```

5. **Update after writes locally**
   ```ts
   // After stock update, update cache instead of re-fetch
   updateProductStock(id, -quantity); // Updates cache internally
   ```

## 🚀 ESTIMATED FIREBASE USAGE

### Daily Operations (Based on 50 orders/day)
- **Reads**: ~240/day (0.48% of free tier)
- **Writes**: ~500/day (2.5% of free tier)
- **Free Tier**: 50k reads, 20k writes/day
- **Headroom**: 200x capacity available

### Cost Breakdown per Order
- 1 read: products (cached, amortized)
- 9 writes: 1 bill_summary + 1 bill_details + 1 daily_sales + (2 * 3 items avg)

## ⚠️ REMOVED EXPENSIVE OPERATIONS
- ❌ 5-second polling in Dashboard
- ❌ Full bills collection scan for reports
- ❌ Full products re-fetch after checkout
- ❌ Full inventory_movements scan
- ❌ Storing productName, staffName in bills
- ❌ Scanning ingredients for low stock
- ❌ Full purchase_requests scan

## 📦 Environment Variables Needed

Create `.env` file:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```
