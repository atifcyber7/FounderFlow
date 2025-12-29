-- Add outsourced_to column to projects table to track which user the project is outsourced to
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS outsourced_to uuid;

-- Add client_user_id to link projects to client users
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_user_id uuid;

-- Update RLS policies for projects to allow clients to see their own projects
DROP POLICY IF EXISTS "Clients can view their own projects" ON public.projects;
CREATE POLICY "Clients can view their own projects" 
ON public.projects 
FOR SELECT 
USING (
  has_role(auth.uid(), 'client'::app_role) AND client_user_id = auth.uid()
);

-- Update RLS policies for outsourced users to see projects assigned to them
DROP POLICY IF EXISTS "Outsourced users can view assigned projects" ON public.projects;
CREATE POLICY "Outsourced users can view assigned projects" 
ON public.projects 
FOR SELECT 
USING (
  has_role(auth.uid(), 'outsourced'::app_role) AND outsourced_to = auth.uid()
);

-- Update RLS policies for tasks to allow outsourced users to see their assigned tasks
DROP POLICY IF EXISTS "Outsourced users can view assigned tasks" ON public.tasks;
CREATE POLICY "Outsourced users can view assigned tasks" 
ON public.tasks 
FOR SELECT 
USING (
  has_role(auth.uid(), 'outsourced'::app_role) AND assigned_to = auth.uid()
);

-- Allow outsourced users to update their assigned tasks
DROP POLICY IF EXISTS "Outsourced users can update assigned tasks" ON public.tasks;
CREATE POLICY "Outsourced users can update assigned tasks" 
ON public.tasks 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'outsourced'::app_role) AND assigned_to = auth.uid()
);