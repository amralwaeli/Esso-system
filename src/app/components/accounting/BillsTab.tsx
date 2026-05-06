import { useState, useEffect } from 'react';
import { storage } from '../../lib/storage';
import type { Bill, Shift } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Lock, Eye, Printer, Download } from 'lucide-react';
import { printReceipt, downloadReceipt } from '../../lib/receipt';

export function BillsTab() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const settings = storage.getSettings();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allShifts = storage.getShifts();
    const allBills = storage.getBills();

    const billsWithLockStatus = allBills.map(bill => {
      const shift = allShifts.find(s => s.id === bill.shiftId);
      if (!shift || !shift.closedAt) {
        return bill;
      }

      const lockTime = new Date(new Date(shift.closedAt).getTime() + settings.billLockHours * 60 * 60 * 1000);
      const isLocked = new Date() >= lockTime;

      return { ...bill, isLocked };
    });

    setBills(billsWithLockStatus.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setShifts(allShifts);
  };

  const viewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDetailOpen(true);
  };

  const getShiftInfo = (shiftId: string) => {
    return shifts.find(s => s.id === shiftId);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bills & Orders</CardTitle>
          <CardDescription>View all transactions with 5-hour post-shift lock enforcement</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map(bill => {
                const shift = getShiftInfo(bill.shiftId);
                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.orderNumber}</TableCell>
                    <TableCell>{new Date(bill.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{bill.staffName}</TableCell>
                    <TableCell className="capitalize">{bill.orderType}</TableCell>
                    <TableCell>{bill.paymentMethodName}</TableCell>
                    <TableCell className="font-medium">{settings.currency} {bill.total.toFixed(2)}</TableCell>
                    <TableCell>
                      {bill.isLocked ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => viewBill(bill)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details: {selectedBill?.orderNumber}</span>
              {selectedBill?.isLocked && (
                <Badge variant="secondary" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedBill && new Date(selectedBill.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#7d7d7d]">Staff</p>
                  <p className="font-medium">{selectedBill.staffName}</p>
                </div>
                <div>
                  <p className="text-[#7d7d7d]">Order Type</p>
                  <p className="font-medium capitalize">{selectedBill.orderType}</p>
                </div>
                {selectedBill.tableNumber && (
                  <div>
                    <p className="text-[#7d7d7d]">Table</p>
                    <p className="font-medium">{selectedBill.tableNumber}</p>
                  </div>
                )}
                <div>
                  <p className="text-[#7d7d7d]">Payment Method</p>
                  <p className="font-medium">{selectedBill.paymentMethodName}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Items</p>
                <div className="space-y-2">
                  {selectedBill.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#fef6f3] p-3 rounded">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-[#7d7d7d]">
                          {settings.currency} {item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">{settings.currency} {item.subtotal.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{settings.currency} {selectedBill.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({settings.taxRate}%)</span>
                  <span>{settings.currency} {selectedBill.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-[#d4622e]">{settings.currency} {selectedBill.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => selectedBill && printReceipt(selectedBill, settings)}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => selectedBill && downloadReceipt(selectedBill, settings)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
