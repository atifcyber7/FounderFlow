-- Update password for atifcyber7@gmail.com
-- This updates the password to 'test1234'
UPDATE auth.users
SET 
  encrypted_password = crypt('test1234', gen_salt('bf')),
  updated_at = now()
WHERE email = 'atifcyber7@gmail.com';