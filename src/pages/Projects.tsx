import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';

interface Project {
  id: string;
  name: string;
  description: string;
  deliverables: string;
  start_date: string;
  deadline: string;
  status: string;
  created_at: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deliverables: '',
    start_date: '',
    deadline: '',
    status: 'active' as 'active' | 'ongoing' | 'completed',
    client_name: '',
    client_email: '',
    client_phone: '',
    total_amount: '',
    amount_paid: '',
  });
  
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
      setFilteredProjects(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('projects').insert([
        {
          name: formData.name,
          description: formData.description,
          deliverables: formData.deliverables,
          start_date: formData.start_date,
          deadline: formData.deadline,
          status: formData.status,
          client_name: formData.client_name || null,
          client_email: formData.client_email || null,
          client_phone: formData.client_phone || null,
          total_amount: formData.total_amount ? parseFloat(formData.total_amount) : 0,
          amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : 0,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      setOpen(false);
      setFormData({
        name: '',
        description: '',
        deliverables: '',
        start_date: '',
        deadline: '',
        status: 'active',
        client_name: '',
        client_email: '',
        client_phone: '',
        total_amount: '',
        amount_paid: '',
      });
      fetchProjects();
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
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'ongoing':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return '';
    }
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
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your projects</p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Project Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Textarea
                  placeholder="Deliverables"
                  value={formData.deliverables}
                  onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                  <Input
                    type="date"
                    placeholder="Deadline"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Client Information</h3>
                  <Input
                    placeholder="Client Name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  />
                  <Input
                    type="email"
                    placeholder="Client Email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  />
                  <Input
                    type="tel"
                    placeholder="Client Phone"
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-sm">Payment Information</h3>
                  <Input
                    type="number"
                    placeholder="Total Project Amount"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Amount Paid"
                    value={formData.amount_paid}
                    onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                  />
                </div>
                
                <Button type="submit" className="w-full btn-primary">
                  Create Project
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="card-elegant">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {project.description}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Start: {new Date(project.start_date).toLocaleDateString()}</p>
                <p>Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProject(project);
                  setShowDetailsDialog(true);
                }}
                className="w-full mt-2"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      )}
      
      {selectedProject && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm mb-2">Project Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Description:</span> {selectedProject.description}</p>
                    <p><span className="text-muted-foreground">Deliverables:</span> {selectedProject.deliverables}</p>
                    <p><span className="text-muted-foreground">Start Date:</span> {new Date(selectedProject.start_date).toLocaleDateString()}</p>
                    <p><span className="text-muted-foreground">Deadline:</span> {new Date(selectedProject.deadline).toLocaleDateString()}</p>
                    <p><span className="text-muted-foreground">Status:</span> <Badge className={getStatusColor(selectedProject.status)}>{selectedProject.status}</Badge></p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-sm mb-2">Client Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedProject.client_name || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedProject.client_email || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedProject.client_phone || 'N/A'}</p>
                  </div>
                  
                  <h3 className="font-semibold text-sm mb-2 mt-4">Payment Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Total Amount:</span> ${Number(selectedProject.total_amount || 0).toFixed(2)}</p>
                    <p><span className="text-muted-foreground">Amount Paid:</span> ${Number(selectedProject.amount_paid || 0).toFixed(2)}</p>
                    <p><span className="text-muted-foreground">Balance:</span> ${(Number(selectedProject.total_amount || 0) - Number(selectedProject.amount_paid || 0)).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}