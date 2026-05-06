import type { Bill, Settings } from '../types';

export function generateReceipt(bill: Bill, settings: Settings): string {
  const lines: string[] = [];
  const width = 42;

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const line = () => '='.repeat(width);
  const dottedLine = () => '-'.repeat(width);

  lines.push(line());
  lines.push(center(settings.businessName.toUpperCase()));
  if (settings.businessAddress) {
    lines.push(center(settings.businessAddress));
  }
  if (settings.businessPhone) {
    lines.push(center(settings.businessPhone));
  }
  lines.push(line());
  lines.push('');

  lines.push(`Order: ${bill.orderNumber}`);
  lines.push(`Date: ${new Date(bill.createdAt).toLocaleString()}`);
  lines.push(`Staff: ${bill.staffName}`);
  lines.push(`Type: ${bill.orderType.toUpperCase()}`);
  if (bill.tableNumber) {
    lines.push(`Table: ${bill.tableNumber}`);
  }
  lines.push('');
  lines.push(dottedLine());
  lines.push('');

  lines.push('ITEMS:');
  bill.items.forEach(item => {
    const nameLine = `${item.productName}`;
    lines.push(nameLine);

    const qtyPrice = `  ${item.quantity} x ${settings.currency} ${item.price.toFixed(2)}`;
    const total = `${settings.currency} ${item.subtotal.toFixed(2)}`;
    const spacing = ' '.repeat(Math.max(1, width - qtyPrice.length - total.length));
    lines.push(`${qtyPrice}${spacing}${total}`);
  });

  lines.push('');
  lines.push(dottedLine());

  const addRow = (label: string, amount: string) => {
    const spacing = ' '.repeat(Math.max(1, width - label.length - amount.length));
    lines.push(`${label}${spacing}${amount}`);
  };

  addRow('Subtotal:', `${settings.currency} ${bill.subtotal.toFixed(2)}`);
  addRow(`Tax (${settings.taxRate}%):`, `${settings.currency} ${bill.tax.toFixed(2)}`);
  lines.push(line());
  addRow('TOTAL:', `${settings.currency} ${bill.total.toFixed(2)}`);
  lines.push(line());

  lines.push('');
  addRow('Payment:', bill.paymentMethodName);
  lines.push('');
  lines.push(center('Thank you for your purchase!'));
  lines.push(center('Please come again'));
  lines.push('');
  lines.push(line());

  return lines.join('\n');
}

export function printReceipt(bill: Bill, settings: Settings) {
  const receiptText = generateReceipt(bill, settings);

  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt - ${bill.orderNumber}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          margin: 20px;
          white-space: pre-wrap;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>${receiptText}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export function downloadReceipt(bill: Bill, settings: Settings) {
  const receiptText = generateReceipt(bill, settings);
  const blob = new Blob([receiptText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${bill.orderNumber}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
