import { useState, useEffect } from 'react';
import type { Staff, Ingredient, LowStockAlert } from '../../types';
import { getIngredients, getLowStockAlerts } from '../../lib/firebase/ingredients';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { AlertTriangle } from 'lucide-react';

export function InventoryTab({ staff }: { staff: Staff }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [ing, al] = await Promise.all([getIngredients(), getLowStockAlerts()]);
    setIngredients(ing);
    setAlerts(al.filter(a => a.currentStock <= a.minStock));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Current</TableHead><TableHead>Minimum</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {alerts.map(a => (
                <TableRow key={a.ingredientId}>
                  <TableCell>{a.ingredientId}</TableCell>
                  <TableCell>{a.currentStock}</TableCell>
                  <TableCell>{a.minStock}</TableCell>
                  <TableCell><Badge variant="destructive">Critical</Badge></TableCell>
                </TableRow>
              ))}
              {alerts.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">All stock healthy</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ingredient Overview</CardTitle><CardDescription>Current kitchen stock levels</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Current Stock</TableHead><TableHead>Unit</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
            <TableBody>
              {ingredients.map(ing => (
                <TableRow key={ing.id}>
                  <TableCell className="font-medium">{ing.name}</TableCell>
                  <TableCell>{ing.currentStock}</TableCell>
                  <TableCell>{ing.unit}</TableCell>
                  <TableCell>{ing.isActive ? 'Yes' : 'No'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}