import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FolderKanban, CheckSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    pendingTasks: 0,
    totalEarnings: 0,
    totalExpenses: 0,
    profit: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('status');

      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status');

      const totalTasks = tasks?.length || 0;
      const pendingTasks = tasks?.filter(t => t.status !== 'done').length || 0;

      let totalEarnings = 0;
      let totalExpenses = 0;

      // Fetch finance data if admin
      if (isAdmin) {
        const { data: financeRecords } = await supabase
          .from('finance_records')
          .select('type, amount');

        totalEarnings = financeRecords?.filter(f => f.type === 'income').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
        totalExpenses = financeRecords?.filter(f => f.type === 'expense').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      }

      setStats({
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        pendingTasks,
        totalEarnings,
        totalExpenses,
        profit: totalEarnings - totalExpenses,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const projectData = [
    { name: 'Active', value: stats.activeProjects },
    { name: 'Ongoing', value: stats.totalProjects - stats.activeProjects - stats.completedProjects },
    { name: 'Completed', value: stats.completedProjects },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to FounderFlow</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalTasks} total
            </p>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card className="card-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Revenue</p>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.profit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Expenses: ${stats.totalExpenses.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { name: 'Income', value: stats.totalEarnings },
                  { name: 'Expenses', value: stats.totalExpenses },
                  { name: 'Profit', value: stats.profit },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}