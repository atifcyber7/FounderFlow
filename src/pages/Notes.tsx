import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface Note {
  id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string };
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notesWithProfiles = await Promise.all((data || []).map(async (note) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', note.created_by)
          .single();
        return { ...note, profiles: profile };
      }));
      
      setNotes(notesWithProfiles);
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
      const { error } = await supabase.from('notes').insert([
        {
          content,
          created_by: user?.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note created successfully',
      });

      setOpen(false);
      setContent('');
      fetchNotes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground">Manage your notes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Write your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
              />
              <Button type="submit" className="w-full btn-primary">
                Create Note
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card key={note.id} className="card-elegant">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{note.profiles?.full_name || 'Unknown'}</span>
                <span>{new Date(note.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No notes yet</p>
        </div>
      )}
    </div>
  );
}