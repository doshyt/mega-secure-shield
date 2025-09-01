-- Remove the database functions and triggers that handle business logic
-- We'll use Edge Functions for authentication/authorization instead

-- Drop existing functions that should be handled by Edge Functions
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- Simplify RLS policies - keep them minimal as requested
-- Remove complex RLS policies and keep simple ones

-- For profiles table - users can only see and update their own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- For user_roles table - disable RLS, let Edge Functions handle access control
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- For vaults table - disable RLS, let Edge Functions handle access control
ALTER TABLE public.vaults DISABLE ROW LEVEL SECURITY;

-- For vault_secrets table - disable RLS, let Edge Functions handle access control
ALTER TABLE public.vault_secrets DISABLE ROW LEVEL SECURITY;

-- Keep only the trigger for automatic timestamps
-- This is safe to keep as it's just updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers exist for timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vaults_updated_at ON public.vaults;
CREATE TRIGGER update_vaults_updated_at
    BEFORE UPDATE ON public.vaults
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vault_secrets_updated_at ON public.vault_secrets;
CREATE TRIGGER update_vault_secrets_updated_at
    BEFORE UPDATE ON public.vault_secrets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();