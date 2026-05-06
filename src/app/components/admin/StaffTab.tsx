import { useState, useEffect } from 'react';
import { getStaff, addStaff, updateStaff } from '../../lib/firebase/staff';
import type { Staff, UserRole } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Plus, Edit, RotateCcw, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export function StaffTab() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pin: '',
    role: 'cashier' as UserRole,
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const data = await getStaff();
    setStaff(data);
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.pin || formData.pin.length !== 4) {
      toast.error('Please fill all fields. PIN must be 4 digits.');
      return;
    }

    const newStaff: Omit<Staff, 'id'> = {
      name: formData.name,
      pin: formData.pin,
      role: formData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await addStaff(newStaff);
    await loadStaff();
    setIsAddOpen(false);
    resetForm();
    toast.success('Staff member added');
  };

  const handleResetPin = async (staffMember: Staff) => {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    await updateStaff(staffMember.id, { pin: newPin });
    await loadStaff();
    toast.success(`PIN reset to: ${newPin}`);
  };

  const handleToggleActive = async (staffMember: Staff) => {
    await updateStaff(staffMember.id, { isActive: !staffMember.isActive });
    await loadStaff();
    toast.success(`Staff ${staffMember.isActive ? 'disabled' : 'enabled'}`);
  };

  const resetForm = () => {
    setFormData({ name: '', pin: '', role: 'cashier' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Staff Management</CardTitle>
            <CardDescription>Manage staff members and their PINs</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
                <DialogDescription>Create a new staff member with PIN access</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Staff name"
                  />
                </div>
                <div>
                  <Label htmlFor="pin">4-Digit PIN</Label>
                  <Input
                    id="pin"
                    type="text"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="1234"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cashier">Cashier</SelectItem>
                      <SelectItem value="accounting">Accounting</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAdd} className="w-full">Add Staff</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{member.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={member.isActive ? 'default' : 'secondary'}>
                    {member.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetPin(member)}
                    title="Reset PIN"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(member)}
                    title={member.isActive ? 'Disable' : 'Enable'}
                  >
                    {member.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
