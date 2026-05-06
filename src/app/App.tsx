import { useEffect } from 'react';
import { HashRouter , Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { initializeFirebase } from './lib/firebase/init';
import { PinLock } from './pages/PinLock';
import { Admin } from './pages/Admin';
import { Cashier } from './pages/Cashier';
import { Accounting } from './pages/Accounting';
import { Reports } from './pages/Reports';
import { Toaster } from './components/ui/sonner';

export default function App() {
  useEffect(() => {
    initializeFirebase().catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <HashRouter >
        <Routes>
          <Route path="/" element={<PinLock />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/inventory" element={<div>Inventory Page Coming Soon</div>} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-center" />
      </HashRouter >
    </AuthProvider>
  );
}