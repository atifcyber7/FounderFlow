import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, FolderKanban, CheckSquare, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { DashboardCard } from '@/components/DashboardCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
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
        <DashboardCard
          title="Total Projects"
          value={stats.totalProjects}
          subtitle={`${stats.activeProjects} active`}
          icon={FolderKanban}
          to="/projects"
        />

        <DashboardCard
          title="Pending Tasks"
          value={stats.pendingTasks}
          subtitle={`of ${stats.totalTasks} total`}
          icon={CheckSquare}
          onClick={() => navigate('/tasks?filter=pending')}
        />

        {isAdmin && (
          <>
            <DashboardCard
              title="Total Earnings"
              value={`$${stats.totalEarnings.toFixed(2)}`}
              subtitle="Revenue"
              icon={DollarSign}
              iconColor="text-green-500"
              to="/finance"
            />

            <DashboardCard
              title="Profit"
              value={`$${stats.profit.toFixed(2)}`}
              subtitle={`Expenses: $${stats.totalExpenses.toFixed(2)}`}
              icon={TrendingUp}
              to="/finance"
            />
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
