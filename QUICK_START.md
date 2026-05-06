# POS System - Quick Start Guide

## First Time Setup

### Initial Access
- A default admin account is pre-configured
- Use your 4-digit PIN to access the Admin Dashboard

### Step 1: Initial Configuration

#### Add Categories (Admin Dashboard → Categories)
Default categories are pre-loaded:
- Beverages (Red)
- Food (Orange)
- Desserts (Pink)
- Snacks (Purple)

Add more as needed!

#### Add Products (Admin Dashboard → Products)
For each product:
1. Click "Add Product"
2. Enter product name (e.g., "Espresso")
3. Set price (e.g., 5.50)
4. Select category
5. Set initial stock (e.g., 100)
6. Set low stock alert threshold (e.g., 10)
7. Click "Add Product"

#### Add Staff (Admin Dashboard → Staff)
1. Click "Add Staff"
2. Enter staff name
3. Create 4-digit PIN
4. Select role (Cashier, Accounting, Logistics, or Admin)
5. Click "Add Staff"

**Note:** Save the PIN securely or reset it later if needed!

#### Configure Settings (Admin Dashboard → Settings)
1. Update business information
2. Verify currency (default: MYR)
3. Set tax rate (default: 6%)
4. Configure operating hours
5. Set shift duration
6. Adjust bill lock hours if needed
7. Click "Save Settings"

## Daily Operations

### First Time Login
1. Open the application
2. Enter your 4-digit PIN
3. Access your designated workspace

### For Cashiers

#### Starting Your Shift
1. Enter your 4-digit PIN at the lock screen
2. Enter opening cash amount (e.g., 100.00)
3. Click "Start Shift"

#### Processing an Order

**Quick Method:**
1. Click products to add to cart
2. Click "Checkout"
3. Print receipt (optional)

**Detailed Method:**
1. Search for products or browse by category
2. Click products to add to cart
3. Adjust quantities using +/- buttons
4. Choose "Dine In" or "Takeaway"
5. If Dine In, enter table number
6. Select payment method (Cash/QR/Card)
7. Review total (subtotal + tax)
8. Click "Checkout"
9. Click "Print Receipt" in notification

**Keyboard Shortcuts:**
- `Ctrl + Enter` = Checkout
- `Ctrl + X` = Clear cart
- `Ctrl + D` = Dine-in mode
- `Ctrl + T` = Takeaway mode

#### Ending Your Shift
1. Click "End Shift" button
2. Review expected cash amount
3. Count physical cash
4. Enter closing cash amount
5. Check difference (should be 0 or small)
6. Add notes if there's a discrepancy
7. Click "End Shift"

### For Admin

#### Checking Dashboard
- View today's sales
- Check total orders
- Monitor active products
- Review low stock alerts

#### Restocking Products
**Option 1: Via Products Tab**
1. Click "Edit" on product
2. Update stock quantity
3. Click "Update Product"

**Option 2: Via Accounting → Inventory (recommended for tracking)**
See Accounting section below

#### Managing Staff
- **Reset PIN:** Click rotate icon → New PIN displayed
- **Disable:** Click user-x icon
- **Enable:** Click user-check icon

#### Viewing Reports
1. Click "Reports" button in header
2. Select time period (Day/Week/Month/Year)
3. Review analytics
4. Click "Export to CSV" to download data

#### Backup Data
1. Go to Settings tab
2. Click "Backup Data"
3. Save JSON file securely
4. Store off-site for disaster recovery

#### Restore Data
1. Go to Settings tab
2. Click "Restore Data"
3. Select backup JSON file
4. Confirm restoration
5. Page will reload automatically

### For Accounting/Logistics

#### Viewing Bills
1. Login with your PIN
2. Go to Bills tab
3. View all orders with lock status
4. Click eye icon to view details
5. Print or download receipts as needed

**Bill Lock Status:**
- **Active:** Can still be edited (within 5-hour window)
- **Locked:** Read-only (after 5 hours from shift close)

#### Managing Inventory

**Restocking (New Shipment):**
1. Go to Inventory tab
2. Click "Add Movement"
3. Select product
4. Choose "Restock (Add)"
5. Enter quantity (e.g., 100)
6. Add reason (e.g., "New shipment from supplier")
7. Click "Submit"

**Adjustment (Corrections):**
1. Go to Inventory tab
2. Click "Add Movement"
3. Select product
4. Choose "Adjustment (+/-)"
5. Enter quantity:
   - Positive (e.g., 10) = Add stock
   - Negative (e.g., -5) = Remove stock
6. Add reason (e.g., "Damaged goods" or "Found extra units")
7. Click "Submit"

**Viewing Movement Log:**
- Complete history of all stock changes
- Shows who made changes and when
- Tracks sales, restocks, and adjustments

## Tips & Best Practices

### For Cashiers
- Start with correct opening cash to ensure accurate end-of-shift reconciliation
- Use keyboard shortcuts for faster operations
- Check stock levels before taking large orders
- Print receipts for all transactions
- Count cash drawer carefully at shift end

### For Admin
- Check low stock alerts daily
- Review reports weekly to identify trends
- Backup data at least weekly
- Update product prices seasonally
- Monitor top-selling products
- Review staff shift differences regularly

### For Accounting
- Audit inventory movements regularly
- Reconcile physical stock monthly
- Export bills data for external accounting
- Review locked bills for discrepancies
- Document all adjustments with clear reasons

### Stock Management
- Set low stock thresholds to 1-2 days of average sales
- Restock before hitting threshold
- Use adjustment feature for damaged/expired goods
- Regularly audit physical vs. system stock

### Security
- Change PINs regularly
- Disable staff accounts when employees leave
- Keep backup files secure
- Don't share admin credentials
- Review shift differences for fraud detection

## Troubleshooting

### "Insufficient stock" error
- Check product stock in Admin → Products
- Restock via Accounting → Inventory
- Or update stock directly in product edit

### Can't edit old bills
- Bills lock 5 hours after shift closes
- This prevents tampering with historical data
- Contact admin to adjust bill lock hours if needed

### PIN not working
- Ensure caps lock is off
- Check with admin if account is disabled
- Request PIN reset from admin

### Shift difference doesn't match
- Recount physical cash
- Review all cash sales during shift
- Check for missing or duplicate orders
- Add notes explaining discrepancy

### Low stock alerts not showing
- Check low stock threshold is set correctly
- Verify product is marked as active
- Threshold should be greater than current stock

## Support

### Data Issues
- Use backup/restore from Settings tab
- Contact system administrator

### Questions
- Refer to POS_FEATURES.md for detailed feature list
- Check keyboard shortcuts guide (keyboard icon in POS)

### Feature Requests
- Document desired features
- Discuss with admin or system owner

## Staff Access

### Admin Access
- Default admin account is pre-configured
- 4-digit PIN authentication
- Can manage PINs via Admin → Staff tab

### Default Settings
- Currency: MYR
- Tax Rate: 6%
- Opening Time: 09:00
- Closing Time: 22:00
- Shift Duration: 8 hours
- Bill Lock: 5 hours

## Common Workflows

### Morning Opening
1. Cashier: Login → Start shift
2. Admin: Check dashboard for low stock
3. Admin: Restock if needed
4. Ready for business!

### During Service
1. Cashier: Process orders
2. Monitor stock levels
3. Switch between dine-in/takeaway as needed
4. Print receipts for customers

### Evening Closing
1. Cashier: End shift → Count cash
2. System: Bills lock 5 hours later
3. Admin: Review daily reports
4. Admin: Export data if needed

### Weekly Review
1. Admin: Check reports for week
2. Analyze top products
3. Review payment method distribution
4. Plan inventory orders
5. Backup data

---

**Remember:** This is a localStorage-based system. Data persists in browser storage. Regular backups are essential!
