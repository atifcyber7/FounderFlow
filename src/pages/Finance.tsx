import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExportButton } from '@/components/ExportButton';

interface FinanceRecord {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  project_id: string;
  projects?: { name: string };
}

export default function Finance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    project_id: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecords();
    fetchProjects();
  }, [dateFilter]);

  const fetchRecords = async () => {
    try {
      let query = supabase
        .from('finance_records')
        .select('*, projects(name)')
        .order('date', { ascending: false });

      // Apply date filter
      const now = new Date();
      if (dateFilter === 'daily') {
        const today = now.toISOString().split('T')[0];
        query = query.eq('date', today);
      } else if (dateFilter === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        query = query.gte('date', weekAgo);
      } else if (dateFilter === 'monthly') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        query = query.gte('date', monthAgo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('id, name');
    setProjects(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('finance_records').insert([
        {
          ...formData,
          amount: parseFloat(formData.amount),
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Finance record added successfully',
      });

      setOpen(false);
      setFormData({
        type: 'income',
        amount: '',
        description: '',
        project_id: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchRecords();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + Number(r.amount), 0);
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + Number(r.amount), 0);
  const profit = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Track income and expenses</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton
            data={records.map(r => ({
              Date: new Date(r.date).toLocaleDateString(),
              Project: r.projects?.name || 'N/A',
              Type: r.type,
              Amount: `$${r.amount}`,
              Description: r.description || '',
            }))}
            filename={`finance-report-${dateFilter}`}
          />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Finance Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                <Button type="submit" className="w-full btn-primary">
                  Add Record
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${profit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Finance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                  <TableCell>{record.projects?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        record.type === 'income'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-red-500/10 text-red-500'
                      }`}
                    >
                      {record.type}
                    </span>
                  </TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell className={`text-right font-medium ${
                    record.type === 'income' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {record.type === 'income' ? '+' : '-'}${Number(record.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}