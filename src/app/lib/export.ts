import type { Bill, Product, Staff, Shift, InventoryMovement } from '../types';

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBills(bills: Bill[]) {
  const data = bills.map(bill => ({
    'Order Number': bill.orderNumber,
    'Date': new Date(bill.createdAt).toLocaleString(),
    'Staff': bill.staffName,
    'Type': bill.orderType,
    'Table': bill.tableNumber || '',
    'Payment Method': bill.paymentMethodName,
    'Subtotal': bill.subtotal.toFixed(2),
    'Tax': bill.tax.toFixed(2),
    'Total': bill.total.toFixed(2),
    'Items Count': bill.items.length,
    'Status': bill.isLocked ? 'Locked' : 'Active',
  }));

  exportToCSV(data, 'bills');
}

export function exportProducts(products: Product[]) {
  const data = products.map(product => ({
    'Product Name': product.name,
    'Price': product.price.toFixed(2),
    'Stock': product.stock,
    'Low Stock Threshold': product.lowStockThreshold,
    'Status': product.isActive ? 'Active' : 'Inactive',
    'Created': new Date(product.createdAt).toLocaleDateString(),
  }));

  exportToCSV(data, 'products');
}

export function exportShifts(shifts: Shift[]) {
  const data = shifts.map(shift => ({
    'Staff': shift.staffName,
    'Opened': new Date(shift.openedAt).toLocaleString(),
    'Closed': shift.closedAt ? new Date(shift.closedAt).toLocaleString() : 'In Progress',
    'Opening Cash': shift.openingCash.toFixed(2),
    'Closing Cash': shift.closingCash?.toFixed(2) || '',
    'Expected': shift.expectedCash?.toFixed(2) || '',
    'Difference': shift.difference?.toFixed(2) || '',
    'Notes': shift.notes || '',
  }));

  exportToCSV(data, 'shifts');
}

export function exportInventoryMovements(movements: InventoryMovement[]) {
  const data = movements.map(movement => ({
    'Date': new Date(movement.createdAt).toLocaleString(),
    'Product': movement.productName,
    'Type': movement.type,
    'Quantity Change': movement.quantity,
    'Previous Stock': movement.previousStock,
    'New Stock': movement.newStock,
    'Reason': movement.reason || '',
    'Created By': movement.createdBy,
  }));

  exportToCSV(data, 'inventory_movements');
}

export function backupAllData() {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    staff: localStorage.getItem('pos_staff'),
    products: localStorage.getItem('pos_products'),
    categories: localStorage.getItem('pos_categories'),
    paymentMethods: localStorage.getItem('pos_payment_methods'),
    settings: localStorage.getItem('pos_settings'),
    shifts: localStorage.getItem('pos_shifts'),
    bills: localStorage.getItem('pos_bills'),
    inventoryMovements: localStorage.getItem('pos_inventory_movements'),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function restoreFromBackup(file: File, onSuccess: () => void, onError: (error: string) => void) {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);

      if (!data.version || !data.exportDate) {
        onError('Invalid backup file format');
        return;
      }

      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'exportDate' && key !== 'version' && value) {
          localStorage.setItem(`pos_${key}`, value as string);
        }
      });

      onSuccess();
    } catch (error) {
      onError('Failed to restore backup: ' + (error as Error).message);
    }
  };

  reader.onerror = () => {
    onError('Failed to read backup file');
  };

  reader.readAsText(file);
}
