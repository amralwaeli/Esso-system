import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ReceiptText } from 'lucide-react';
import { getFinancialReport } from '../../lib/firebase/reports';
import { storage } from '../../lib/storage';

export function FinancialReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const settings = storage.getSettings();

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const report = await getFinancialReport(30); // Last 30 days
        setData(report);
      } catch (err) {
        console.error('Failed to load financial report', err);
        setError('Could not load financial report. Check Firebase rules and configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Financial Report...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const chartData = [
    { name: 'Revenue', amount: data?.totalRevenue || 0, fill: '#10b981' },
    { name: 'Expenses', amount: data?.totalExpenses || 0, fill: '#ef4444' },
    { name: 'Profit', amount: data?.netProfit || 0, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data?.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 Days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data?.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Purchases & Bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data?.netProfit.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Purchase Bills</CardTitle>
            <ReceiptText className="h-4 w-4 text-[#d4622e]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.purchaseCount || 0}</div>
            <p className="text-xs text-muted-foreground">Recorded in last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Flow (Revenue vs Expenses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ingredient</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recentExpenses?.map((bill: any) => (
                <TableRow key={bill.id}>
                  <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{bill.ingredientId}</TableCell>
                  <TableCell>{bill.supplier || '-'}</TableCell>
                  <TableCell>{bill.invoiceNumber || '-'}</TableCell>
                  <TableCell className="font-medium text-red-600">
                    {settings.currency} {(bill.totalCost || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.recentExpenses || data.recentExpenses.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No purchase bills recorded in this period</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
