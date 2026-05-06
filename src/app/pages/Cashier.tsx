import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../lib/storage';
import type { Shift } from '../types';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';
import { ShiftManager } from '../components/cashier/ShiftManager';
import { POS } from '../components/cashier/POS';

export function Cashier() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);

  useEffect(() => {
    if (!staff || staff.role !== 'cashier') {
      navigate('/');
      return;
    }

    const shift = storage.getCurrentShift();
    if (shift && shift.staffId === staff.id && !shift.closedAt) {
      setCurrentShift(shift);
    }
  }, [staff, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleShiftStart = (shift: Shift) => {
    setCurrentShift(shift);
  };

  const handleShiftEnd = () => {
    setCurrentShift(null);
  };

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#fef6f3]">
      <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#d4622e]">Cashier POS</h1>
            <p className="text-sm text-[#7d7d7d]">{staff.name}</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!currentShift ? (
          <ShiftManager staff={staff} onShiftStart={handleShiftStart} />
        ) : (
          <POS shift={currentShift} staff={staff} onShiftEnd={handleShiftEnd} />
        )}
      </main>
    </div>
  );
}
