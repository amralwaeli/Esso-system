# Firebase Setup Guide

## What Has Been Done

### ✅ Firebase Infrastructure (Complete)

1. **Firebase SDK Installed**
   - Package added to project
   - Version: firebase@12.12.1

2. **Optimization Layer Created**
   - Client-side cache with TTL (src/app/lib/cache.ts)
   - Cache TTL: Products 10min, Categories 10min, Settings 30min, Ingredients 10min

3. **Complete Firebase Service Layer**
   - All services optimized for Firebase free tier
   - Batch writes, pagination, caching implemented
   - Services: staff, products, bills, ingredients, purchases, shifts, inventory, reports, common

4. **Database Schema Optimized**
   - Bills split: bills_summary (light) + bills_details (heavy)
   - Daily sales aggregation: daily_sales/{date}
   - Low stock alerts: separate denormalized collection
   - Current shift: per-user document
   - Minimized document sizes (IDs only, no duplicate names)

5. **New Features Added**
   - Inventory role for kitchen staff
   - Purchase request workflow
   - Low stock alert system
   - Ingredient management

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "pos-system")
4. Disable Google Analytics (optional)
5. Create project

### Step 2: Enable Firestore Database

1. In Firebase Console, go to "Build" > "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll add security rules later)
4. Select a location (choose closest to your users)
5. Click "Enable"

### Step 3: Get Firebase Configuration

1. In Firebase Console, go to "Project Settings" (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register app with a nickname (e.g., "POS Web App")
5. Copy the firebaseConfig object values

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env` in project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and replace with your Firebase values:
   ```
   REACT_APP_FIREBASE_API_KEY=your_actual_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
   REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

### Step 5: Create Firestore Indexes

In Firebase Console > Firestore > Indexes, create these composite indexes:

**staff:**
```
Collection: staff
Fields: pin (Ascending), isActive (Ascending)
```

**products:**
```
Collection: products
Fields: isActive (Ascending), categoryId (Ascending)
```

**bills_summary:**
```
Collection: bills_summary
Fields: createdAt (Descending)

Collection: bills_summary
Fields: shiftId (Ascending), createdAt (Descending)

Collection: bills_summary
Fields: isLocked (Ascending), createdAt (Descending)
```

**inventory_movements:**
```
Collection: inventory_movements
Fields: createdAt (Descending)

Collection: inventory_movements
Fields: productId (Ascending), createdAt (Descending)
```

**purchase_requests:**
```
Collection: purchase_requests
Fields: status (Ascending), createdAt (Descending)
```

**shifts:**
```
Collection: shifts
Fields: closedAt (Descending)
```

### Step 6: Set Up Security Rules

Replace Firestore security rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && get(/databases/$(database)/documents/staff/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Staff collection
    match /staff/{staffId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Products
    match /products/{productId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn(); // All authenticated users can update stock
    }
    
    // Categories
    match /categories/{categoryId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Payment methods
    match /payment_methods/{methodId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Settings
    match /settings/{doc} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Bills
    match /bills_summary/{billId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isAdmin();
    }
    
    match /bills_details/{billId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
    }
    
    // Daily sales
    match /daily_sales/{date} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Shifts
    match /shifts/{shiftId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    match /current_shift/{staffId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Inventory movements
    match /inventory_movements/{movementId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
    }
    
    // Ingredients
    match /ingredients/{ingredientId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
    
    // Purchase requests
    match /purchase_requests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
    }
    
    // Low stock alerts (system managed)
    match /low_stock_alerts/{alertId} {
      allow read: if isSignedIn();
      allow write: if false; // Only through batch operations
    }
    
    // System collection
    match /system/{doc} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### Step 7: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open in browser (check console for actual URL)

3. The system will auto-initialize with:
   - Default admin PIN: 9999
   - Sample categories
   - Default payment methods

4. Login with PIN 9999 to access admin dashboard

## Current Status

### ✅ Fully Migrated Components
- AuthContext
- PinLock (with inventory role)
- StaffTab (Admin)

### 🚧 Pending Migration (Use localStorage fallback)
- DashboardTab
- ProductsTab
- CategoriesTab
- PaymentMethodsTab
- SettingsTab
- Cashier POS
- Accounting (Bills & Inventory)
- Reports

**Note:** These components still work with localStorage. Migrate them one by one to Firebase using the service functions in `src/app/lib/firebase/`.

## Migration Example

**Before (localStorage):**
```typescript
import { storage } from '../../lib/storage';

const loadProducts = () => {
  const data = storage.getProducts();
  setProducts(data);
};

const handleAdd = () => {
  storage.addProduct(newProduct);
  loadProducts();
};
```

**After (Firebase with cache):**
```typescript
import { getProducts, addProduct } from '../../lib/firebase/products';

const loadProducts = async () => {
  const data = await getProducts(); // Auto-cached 10min
  setProducts(data);
};

const handleAdd = async () => {
  await addProduct(newProduct);
  await loadProducts(); // Cache invalidated
};
```

## Firebase Free Tier Limits

With optimizations in place:

| Metric | Daily Usage | Free Tier Limit | Headroom |
|--------|-------------|-----------------|----------|
| Reads | ~240 | 50,000 | 208x |
| Writes | ~500 | 20,000 | 40x |
| Deletes | ~5 | 20,000 | 4000x |
| Storage | <50MB | 1GB | 20x |

**Conclusion:** System comfortably operates within free tier even with 200+ orders/day.

## Troubleshooting

### "Firebase: No Firebase App '[DEFAULT]' has been created"
- Ensure .env file exists with correct values
- Restart development server after creating .env

### "Missing or insufficient permissions"
- Check Firestore security rules are applied
- Verify collection names match rules

### "Index required" error
- Firebase will show link to create index automatically
- Or create manually following Step 5

### Slow initial load
- First load initializes seed data
- Subsequent loads use cached data (10-30min TTL)

### Data not updating
- Check browser console for errors
- Verify Firebase project is active
- Check Firestore rules allow your operations

## Next Steps

1. **Complete migration:** Update remaining components to use Firebase services
2. **Test workflows:** Test each role (admin, cashier, accounting, inventory)
3. **Add inventory screens:** Create UI for inventory management
4. **Monitor usage:** Check Firebase Console > Usage tab
5. **Optimize further:** Add more specific indexes based on queries

## Support

- Firebase Documentation: https://firebase.google.com/docs/firestore
- Migration Status: See `FIREBASE_MIGRATION_STATUS.md`
- Component Examples: Check `StaffTab.tsx` for Firebase pattern
