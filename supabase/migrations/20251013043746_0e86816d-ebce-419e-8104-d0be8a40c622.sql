-- Add client information and payment tracking to projects
ALTER TABLE public.projects
ADD COLUMN client_name TEXT,
ADD COLUMN client_email TEXT,
ADD COLUMN client_phone TEXT,
ADD COLUMN total_amount NUMERIC DEFAULT 0,
ADD COLUMN amount_paid NUMERIC DEFAULT 0;

-- Create payments table for detailed payment tracking
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Users can view all payments"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add trigger for payments updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();