# POS System Features

A comprehensive Point of Sale system built with React, TypeScript, and Tailwind CSS with localStorage persistence.

## Authentication & Authorization

### Role-Based Access Control
- **Admin**: PIN-based access (4-digit)
- **Cashier**: PIN-based access (4-digit)
- **Accounting**: PIN-based access (4-digit)
- **Logistics**: PIN-based access (4-digit)

### Login Flow
1. Enter 4-digit PIN at lock screen (using on-screen keypad or keyboard)
2. Click "Enter" button or press Enter key to submit
3. Automatic routing based on role

## Admin Module

### Dashboard
- Today's sales and order statistics
- Active product count
- Low stock alerts with product list
- Real-time updates every 5 seconds

### Staff Management
- Add staff with name, PIN, and role
- Enable/disable staff accounts
- Reset PINs (generates random 4-digit PIN)
- View staff creation dates

### Product Management
- CRUD operations for products
- Set price, stock, and low stock threshold
- Category assignment
- Stock tracking with alerts
- Active/inactive status

### Category Management
- Create product categories
- Choose from 10 preset colors
- Custom ordering
- Visual color indicators

### Payment Methods
- Pre-configured: Cash and QR Code
- Add custom payment methods (Card, Other)
- Enable/disable payment options
- Type classification (cash/qr/card/other)

### Settings
- Business information (name, address, phone)
- Currency configuration
- Tax rate percentage
- Operating hours (opening/closing times)
- Shift duration in hours
- Bill lock period (default: 5 hours after shift close)

### Backup & Restore
- Export all data to JSON backup file
- Restore from backup file
- Includes: products, bills, shifts, staff, settings, inventory movements

## Cashier Module

### Shift Management
- Open shift with opening cash amount
- Track shift duration
- Close shift with cash count reconciliation
- Automatic difference calculation
- Optional notes for shift closure

### POS Interface
- Touch-friendly product grid
- Category-based filtering
- **Product search** with real-time filtering
- Visual stock indicators

### Cart Management
- Add/remove items
- Adjust quantities with +/- buttons
- Real-time subtotal calculations
- Order type selection (Dine-in/Takeaway)
- Table number for dine-in orders

### Payment Processing
- Select payment method
- Tax calculation (configurable rate)
- Automatic stock deduction on checkout
- Order number generation
- **Receipt printing** with print action in toast notification

### Keyboard Shortcuts
- `Ctrl + Enter`: Checkout
- `Ctrl + X`: Clear cart
- `Ctrl + D`: Switch to Dine-in
- `Ctrl + T`: Switch to Takeaway
- `Esc`: Close dialog
- Access shortcuts guide via keyboard icon

### Shift Summary Card
- Live opening cash display
- Running total of cash sales
- Expected cash drawer amount
- Total orders count

## Accounting/Logistics Module

### Bills Management
- View all orders with complete details
- Automatic bill locking (5 hours after shift close)
- Filter by date, staff, payment method
- Order details: items, quantities, prices, totals
- Lock status indicators
- **Print receipts** from bill details
- **Download receipts** as text files

### Receipt Features
- Professional formatted receipts
- Business information header
- Itemized list with quantities and prices
- Tax breakdown
- Total calculation
- Payment method
- Order metadata (number, date, staff, table)

### Inventory Management
- **Restock**: Add inventory
- **Adjustment**: Increase or decrease stock (+/-)
- Reason tracking for all movements
- Movement log with full history

### Inventory Movement Log
- Complete audit trail
- Movement type (restock/adjustment/sale)
- Quantity changes (positive/negative)
- Previous and new stock levels
- Timestamp and staff tracking
- Reason/description field

## Reports Module

### Time Period Filters
- Today
- Last 7 Days
- This Month
- This Year

### Statistics Cards
- Total sales with currency
- Total orders count
- Average order value
- Total items sold

### Sales Analytics
- **Bar chart**: Sales over time (last 10 days)
- **Pie chart**: Sales breakdown by payment method
- Color-coded visualization

### Top Products
- Top 5 products by revenue
- Units sold count
- Total revenue per product
- Ranked display (1-5)

### Export Features
- **Export to CSV**: Download filtered bills data
- Includes all order details
- Date-stamped filename

## Technical Features

### Data Persistence
- LocalStorage-based persistence
- Automatic data initialization
- Seed data on first run (categories, payment methods)

### Stock Management
- Automatic stock deduction on sales
- Stock alerts at configured threshold
- Inventory movement tracking
- Real-time stock updates

### Bill Lock Enforcement
- Server-time simulation for bill locking
- Configurable lock period (default: 5 hours)
- Lock status calculated from shift close time
- Prevents post-shift tampering

### Navigation
- Role-based routing
- Automatic redirects for unauthorized access
- Admin → Reports quick access
- Logout returns to PIN lock screen

### UI/UX Features
- Warm terracotta color scheme (#e07856, #d4622e)
- Amber accent colors
- Responsive design
- Toast notifications for all actions
- Loading states
- Error handling
- Confirmation dialogs for destructive actions

### Development
- TypeScript for type safety
- React Router for navigation
- Recharts for data visualization
- Shadcn/ui component library
- Lucide icons
- Sonner for toast notifications
- LocalStorage utilities

## Workflow Example

### Opening Shift (Cashier)
1. Login with PIN
2. Start shift → Enter opening cash (e.g., MYR 100.00)
3. POS opens with product grid

### Processing Orders
1. Search or browse products by category
2. Click products to add to cart
3. Adjust quantities as needed
4. Select Dine-in/Takeaway
5. Enter table number (if dine-in)
6. Choose payment method
7. Click Checkout
8. Print receipt via toast action

### Closing Shift
1. Click "End Shift" button
2. Review opening cash and cash sales
3. Count and enter closing cash
4. System calculates difference
5. Add notes if needed
6. Confirm shift closure
7. Bills automatically lock after 5 hours

### Admin Tasks
1. Login with 4-digit admin PIN
2. Check dashboard for low stock alerts
3. Restock products via Products tab
4. Add new staff members with 4-digit PINs
5. View/edit settings
6. Access reports for analytics
7. Export data or create backup

### Viewing Reports
1. Navigate from Admin → Reports button
2. Select time period filter
3. Review statistics cards
4. Analyze charts
5. Check top products
6. Export to CSV for external analysis

## Data Export Formats

### Bills CSV
- Order Number, Date, Staff, Type, Table, Payment Method, Subtotal, Tax, Total, Items Count, Status

### Products CSV
- Product Name, Price, Stock, Low Stock Threshold, Status, Created Date

### Inventory Movements CSV
- Date, Product, Type, Quantity Change, Previous Stock, New Stock, Reason, Created By

### Backup JSON
- Complete system backup with all tables
- Version and export date metadata
- Restore capability with validation

## Future Enhancement Ideas
- Multi-terminal support
- Real-time sync across devices
- Customer display screen
- Kitchen display system
- Discount and promotion management
- Customer loyalty program
- Email receipts
- SMS notifications
- Barcode scanning
- Employee time tracking
- Vendor management
- Purchase orders
- Expense tracking
- Profit margin analysis
- Customer order history
- Table reservation system
