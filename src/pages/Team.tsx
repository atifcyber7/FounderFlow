import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Shield, Trash2, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserWithRole {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function Team() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'member' as 'admin' | 'member',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Get user emails from auth metadata (admin only can access this through edge function)
      const usersWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const role = roles.find((r) => r.user_id === profile.id);
          
          // Fetch email through Supabase admin API
          const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
          
          return {
            ...profile,
            email: authData?.user?.email || 'N/A',
            role: role?.role || 'member',
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error: any) {
      // If admin API fails, just show profiles without emails
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (profiles) {
        const usersWithRoles = profiles.map((profile) => {
          const role = roles?.find((r) => r.user_id === profile.id);
          return {
            ...profile,
            email: 'Hidden',
            role: role?.role || 'member',
          };
        });
        setUsers(usersWithRoles);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update role if not member (default is member via trigger)
        if (formData.role === 'admin') {
          const { error: roleError } = await supabase
            .from('user_roles')
            .update({ role: formData.role })
            .eq('user_id', authData.user.id);

          if (roleError) throw roleError;
        }

        toast({
          title: 'Success',
          description: 'User invited successfully. They will receive a confirmation email.',
        });

        setOpen(false);
        setFormData({
          email: '',
          password: '',
          full_name: '',
          role: 'member',
        });
        fetchUsers();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;

    try {
      // Note: Deleting from auth.users requires admin privileges
      // In production, this should be done via an edge function
      const { error } = await supabase.auth.admin.deleteUser(selectedUserId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });

      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Unable to delete user. This requires admin privileges.',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin'
      ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      : 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="card-elegant">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gradient">Team Management</h1>
          <p className="text-muted-foreground">Manage users and their roles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                type="password"
                placeholder="Temporary Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
              <Select
                value={formData.role}
                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full btn-primary">
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="card-elegant">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{user.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                </div>
                <Badge className={getRoleBadgeColor(user.role)}>
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">
                <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'member')}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found</p>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
