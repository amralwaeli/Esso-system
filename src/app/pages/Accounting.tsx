import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';
import { FinancialReport } from '../components/accounting/FinancialReport';
import { LogisticsPanel } from '../components/accounting/LogisticsPanel';

export function Accounting() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!staff || (staff.role !== 'accounting' && staff.role !== 'logistics')) {
      navigate('/');
    }
  }, [staff, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!staff) return null;

  const isAccounting = staff.role === 'accounting';

  return (
    <div className="min-h-screen bg-[#fef6f3]">
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d4622e]">
              {isAccounting ? 'Financial Overview' : 'Logistics & Procurement'}
            </h1>
            <p className="text-sm text-[#7d7d7d]">Welcome, {staff.name}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isAccounting ? <FinancialReport /> : <LogisticsPanel />}
      </main>
    </div>
  );
}