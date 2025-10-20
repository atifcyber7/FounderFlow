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
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  project_id: string;
  projects?: { name: string };
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    deadline: '',
    status: 'todo' as 'todo' | 'in_progress' | 'done',
  });

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, projects(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
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
      const { error } = await supabase.from('tasks').insert([
        {
          ...formData,
          created_by: user?.id,
          assigned_to: user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setOpen(false);
      setFormData({
        title: '',
        description: '',
        project_id: '',
        deadline: '',
        status: 'todo',
      });
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task status updated',
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'done':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return '';
    }
  };

  const groupedTasks = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Task Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
              <Button type="submit" className="w-full btn-primary">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(['todo', 'in_progress', 'done'] as const).map((status) => (
          <Card key={status} className="card-elegant">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase">
                {status.replace('_', ' ')}
                <Badge variant="outline" className="ml-2">
                  {groupedTasks[status].length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedTasks[status].map((task) => (
                <Card key={task.id} className="bg-secondary/50">
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                    {task.projects && (
                      <p className="text-xs text-primary">{task.projects.name}</p>
                    )}
                    {task.deadline && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(task.deadline).toLocaleDateString()}
                      </p>
                    )}
                    <Select
                      value={task.status}
                      onValueChange={(value: 'todo' | 'in_progress' | 'done') => updateTaskStatus(task.id, value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
              {groupedTasks[status].length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}