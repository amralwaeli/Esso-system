import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/storage';
import type { Bill, DailySummary } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { LogOut, TrendingUp, ShoppingCart, DollarSign, TrendingDown, Download } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportBills } from '../lib/export';

type PeriodType = 'day' | 'week' | 'month' | 'year';

export function Reports() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>('day');
  const [bills, setBills] = useState<Bill[]>([]);

  const settings = storage.getSettings();

  useEffect(() => {
    if (!staff || (staff.role !== 'admin' && staff.role !== 'accounting')) {
      navigate('/');
      return;
    }
    setBills(storage.getBills());
  }, [staff, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date;

    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return { start, end: now };
  };

  const { start, end } = getDateRange();
  const filteredBills = bills.filter(b => {
    const billDate = new Date(b.createdAt);
    return billDate >= start && billDate <= end;
  });

  const totalSales = filteredBills.reduce((sum, b) => sum + b.total, 0);
  const totalOrders = filteredBills.length;

  const salesByDate = filteredBills.reduce((acc, bill) => {
    const date = new Date(bill.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += bill.total;
    return acc;
  }, {} as Record<string, number>);

  const salesChartData = Object.entries(salesByDate).map(([date, sales]) => ({
    date,
    sales: parseFloat(sales.toFixed(2)),
  })).slice(-10);

  const paymentMethods = storage.getPaymentMethods();
  const salesByPayment = filteredBills.reduce((acc, bill) => {
    if (!acc[bill.paymentMethodName]) {
      acc[bill.paymentMethodName] = 0;
    }
    acc[bill.paymentMethodName] += bill.total;
    return acc;
  }, {} as Record<string, number>);

  const paymentChartData = Object.entries(salesByPayment).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }));

  const COLORS = ['#e07856', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  const topProducts = filteredBills
    .flatMap(b => b.items)
    .reduce((acc, item) => {
      if (!acc[item.productName]) {
        acc[item.productName] = { quantity: 0, revenue: 0 };
      }
      acc[item.productName].quantity += item.quantity;
      acc[item.productName].revenue += item.subtotal;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProductsList = Object.entries(topProducts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#fef6f3]">
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d4622e]">Reports</h1>
            <p className="text-sm text-[#7d7d7d]">Sales analytics and insights</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="outline" onClick={() => exportBills(filteredBills)}>
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
          <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="bg-gradient-to-br from-[#e07856] to-[#d4622e] text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.currency} {totalSales.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-[#7d7d7d]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {settings.currency} {totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : '0.00'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
              <TrendingDown className="h-4 w-4 text-[#7d7d7d]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredBills.reduce((sum, b) => sum + b.items.reduce((s, i) => s + i.quantity, 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time</CardTitle>
              <CardDescription>Daily sales trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#e07856" name={`Sales (${settings.currency})`} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Sales breakdown by payment type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProductsList.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#fef6f3] font-bold text-[#d4622e]">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-[#7d7d7d]">{product.quantity} units sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#d4622e]">{settings.currency} {product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
