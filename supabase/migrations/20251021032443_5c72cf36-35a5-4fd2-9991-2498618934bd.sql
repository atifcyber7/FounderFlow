-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Create RLS policies for avatar uploads
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Grant admin role to specific email
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Get the user ID for the email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'atifcyber7@gmail.com';
  
  -- Only proceed if user exists
  IF target_user_id IS NOT NULL THEN
    -- Delete existing role if any
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');
  END IF;
END $$;