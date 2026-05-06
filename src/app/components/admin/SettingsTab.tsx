import { useState, useEffect, useRef } from 'react';
import { storage } from '../../lib/storage';
import type { Settings } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { backupAllData, restoreFromBackup } from '../../lib/export';

export function SettingsTab() {
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    storage.setSettings(settings);
    toast.success('Settings saved');
  };

  const handleBackup = () => {
    backupAllData();
    toast.success('Backup downloaded');
  };

  const handleRestore = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    restoreFromBackup(
      file,
      () => {
        toast.success('Data restored successfully. Refreshing...');
        setTimeout(() => window.location.reload(), 1000);
      },
      (error) => {
        toast.error(error);
      }
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Configure your business details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
              placeholder="My Business"
            />
          </div>
          <div>
            <Label htmlFor="businessAddress">Address</Label>
            <Input
              id="businessAddress"
              value={settings.businessAddress}
              onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
              placeholder="123 Main St"
            />
          </div>
          <div>
            <Label htmlFor="businessPhone">Phone</Label>
            <Input
              id="businessPhone"
              value={settings.businessPhone}
              onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
              placeholder="+60123456789"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency & Tax</CardTitle>
          <CardDescription>Configure pricing and tax settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currency">Currency Code</Label>
            <Input
              id="currency"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              placeholder="MYR"
            />
          </div>
          <div>
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.1"
              value={settings.taxRate}
              onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
              placeholder="6"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operating Hours</CardTitle>
          <CardDescription>Set business hours and shift duration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="openingTime">Opening Time</Label>
              <Input
                id="openingTime"
                type="time"
                value={settings.openingTime}
                onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="closingTime">Closing Time</Label>
              <Input
                id="closingTime"
                type="time"
                value={settings.closingTime}
                onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="shiftDuration">Shift Duration (hours)</Label>
            <Input
              id="shiftDuration"
              type="number"
              value={settings.shiftDurationHours}
              onChange={(e) => setSettings({ ...settings, shiftDurationHours: parseInt(e.target.value) || 8 })}
              placeholder="8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bill Lock Settings</CardTitle>
          <CardDescription>Configure post-shift bill lock period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="billLockHours">Bill Lock Hours (after shift close)</Label>
            <Input
              id="billLockHours"
              type="number"
              value={settings.billLockHours}
              onChange={(e) => setSettings({ ...settings, billLockHours: parseInt(e.target.value) || 5 })}
              placeholder="5"
            />
            <p className="text-sm text-[#7d7d7d] mt-1">
              Bills will be locked {settings.billLockHours} hours after the shift closes
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup & Restore</CardTitle>
          <CardDescription>Download or restore your POS data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBackup} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Backup Data
            </Button>
            <Button variant="outline" onClick={handleRestore} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              Restore Data
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-sm text-[#7d7d7d]">
            Backup includes all data: products, bills, shifts, staff, and settings.
            Restoring will overwrite current data.
          </p>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full">
        Save Settings
      </Button>
    </div>
  );
}
