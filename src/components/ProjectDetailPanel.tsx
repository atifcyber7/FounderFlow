import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, User, Mail, Phone, DollarSign, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  deadline: string;
  assigned_to: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  deliverables: string;
  start_date: string;
  deadline: string;
  status: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  total_amount: number | null;
  amount_paid: number | null;
  outsourced_to: string | null;
}

interface ProjectDetailPanelProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdate?: () => void;
}

export function ProjectDetailPanel({ 
  project, 
  open, 
  onOpenChange,
  onProjectUpdate 
}: ProjectDetailPanelProps) {
  const { isAdmin, isOutsourced, user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    assigned_to: '',
    status: 'todo' as 'todo' | 'in_progress' | 'done',
  });

  useEffect(() => {
    if (project && open) {
      fetchTasks();
      if (isAdmin) {
        fetchMembers();
      }
    }
  }, [project, open]);

  const fetchTasks = async () => {
    if (!project) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setTasks(data || []);
    }
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name');
    setMembers(data || []);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !user) return;

    try {
      const { error } = await supabase.from('tasks').insert([{
        ...taskFormData,
        project_id: project.id,
        created_by: user.id,
        assigned_to: taskFormData.assigned_to || user.id,
      }]);

      if (error) throw error;

      toast({ title: 'Success', description: 'Task added successfully' });
      setShowTaskForm(false);
      setTaskFormData({
        title: '',
        description: '',
        deadline: '',
        assigned_to: '',
        status: 'todo',
      });
      fetchTasks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ongoing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'todo': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'done': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return '';
    }
  };

  if (!project) return null;

  // Outsourced users see limited info
  const showSensitiveInfo = !isOutsourced;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[50vw] sm:max-w-[50vw] p-0"
      >
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl">{project.name}</SheetTitle>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
            </SheetHeader>

            <Separator />

            {/* Project Description */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground">
                {project.description || 'No description provided'}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Start Date
                </h4>
                <p className="text-sm font-medium">
                  {new Date(project.start_date).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Deadline
                </h4>
                <p className="text-sm font-medium">
                  {new Date(project.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Stakeholder Info - Hidden for outsourced users */}
            {showSensitiveInfo && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold">Stakeholder Information</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{project.client_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{project.client_email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{project.client_phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Budget - Hidden for outsourced users */}
            {showSensitiveInfo && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-semibold">
                        ${Number(project.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Amount Paid</p>
                      <p className="text-lg font-semibold text-green-500">
                        ${Number(project.amount_paid || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-lg font-semibold text-orange-500">
                        ${(Number(project.total_amount || 0) - Number(project.amount_paid || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Tasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Tasks</h3>
                {isAdmin && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowTaskForm(!showTaskForm)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Task
                  </Button>
                )}
              </div>

              {/* Add Task Form */}
              {showTaskForm && isAdmin && (
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    <form onSubmit={handleAddTask} className="space-y-3">
                      <Input
                        placeholder="Task title"
                        value={taskFormData.title}
                        onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                        required
                      />
                      <Textarea
                        placeholder="Description"
                        value={taskFormData.description}
                        onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={taskFormData.deadline}
                          onChange={(e) => setTaskFormData({ ...taskFormData, deadline: e.target.value })}
                        />
                        <Select
                          value={taskFormData.assigned_to}
                          onValueChange={(value) => setTaskFormData({ ...taskFormData, assigned_to: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Assign to" />
                          </SelectTrigger>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Add Task</Button>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowTaskForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Task List */}
              <div className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks for this project
                  </p>
                ) : (
                  tasks.map((task) => (
                    <Card key={task.id} className="bg-secondary/50">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            {task.deadline && (
                              <p className="text-xs text-muted-foreground">
                                Due: {new Date(task.deadline).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(task.status)} variant="outline">
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
