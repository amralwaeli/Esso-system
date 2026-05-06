import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LogOut, LayoutDashboard, Users, Package, FolderTree, CreditCard, Settings, BarChart3 } from 'lucide-react';
import { DashboardTab } from '../components/admin/DashboardTab';
import { StaffTab } from '../components/admin/StaffTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { PaymentMethodsTab } from '../components/admin/PaymentMethodsTab';
import { SettingsTab } from '../components/admin/SettingsTab';

export function Admin() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!staff || staff.role !== 'admin') {
      navigate('/');
    }
  }, [staff, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#fef6f3]">
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d4622e]">Admin Dashboard</h1>
            <p className="text-sm text-[#7d7d7d]">Welcome, {staff.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/reports')}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="staff">
              <Users className="mr-2 h-4 w-4" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories">
              <FolderTree className="mr-2 h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>

          <TabsContent value="staff">
            <StaffTab />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentMethodsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
