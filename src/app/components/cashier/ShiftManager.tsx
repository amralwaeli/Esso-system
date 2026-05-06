import { useState } from 'react';
import { storage } from '../../lib/storage';
import type { Staff, Shift } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

interface ShiftManagerProps {
  staff: Staff;
  onShiftStart: (shift: Shift) => void;
}

export function ShiftManager({ staff, onShiftStart }: ShiftManagerProps) {
  const [openingCash, setOpeningCash] = useState('');
  const settings = storage.getSettings();

  const handleStartShift = () => {
    if (!openingCash || parseFloat(openingCash) < 0) {
      toast.error('Please enter a valid opening cash amount');
      return;
    }

    const newShift: Shift = {
      id: Date.now().toString(),
      staffId: staff.id,
      staffName: staff.name,
      openedAt: new Date().toISOString(),
      openingCash: parseFloat(openingCash),
    };

    storage.addShift(newShift);
    storage.setCurrentShift(newShift);
    onShiftStart(newShift);
    toast.success('Shift started');
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-[#fef6f3] rounded-full w-fit">
            <Clock className="h-8 w-8 text-[#d4622e]" />
          </div>
          <CardTitle>Start Your Shift</CardTitle>
          <CardDescription>Enter the opening cash amount in the drawer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="openingCash">Opening Cash ({settings.currency})</Label>
            <Input
              id="openingCash"
              type="number"
              step="0.01"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <Button onClick={handleStartShift} className="w-full" size="lg">
            Start Shift
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
