-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on vaults table  
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles table
-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Policy: Admins can view all user roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Only admins can insert user roles
CREATE POLICY "Only admins can insert user roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Only admins can update user roles
CREATE POLICY "Only admins can update user roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Only admins can delete user roles
CREATE POLICY "Only admins can delete user roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for vaults table
-- Policy: Admins can view all vaults
CREATE POLICY "Admins can view all vaults" 
ON public.vaults 
FOR SELECT 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can view their own vaults
CREATE POLICY "Owners can view their own vaults" 
ON public.vaults 
FOR SELECT 
TO authenticated
USING (owner_id = auth.uid());

-- Policy: Vault users and viewers can view vaults (but not secrets)
CREATE POLICY "Vault users and viewers can view vaults" 
ON public.vaults 
FOR SELECT 
TO authenticated
USING (
  public.get_user_role(auth.uid()) IN ('vault_user', 'viewer')
);

-- Policy: Admins can insert vaults
CREATE POLICY "Admins can insert vaults" 
ON public.vaults 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can create their own vaults
CREATE POLICY "Users can create their own vaults" 
ON public.vaults 
FOR INSERT 
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Policy: Admins can update all vaults
CREATE POLICY "Admins can update all vaults" 
ON public.vaults 
FOR UPDATE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can update their own vaults
CREATE POLICY "Owners can update their own vaults" 
ON public.vaults 
FOR UPDATE 
TO authenticated
USING (owner_id = auth.uid());

-- Policy: Vault users can update vault state (open/close)
CREATE POLICY "Vault users can update vault state" 
ON public.vaults 
FOR UPDATE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'vault_user');

-- Policy: Admins can delete vaults
CREATE POLICY "Admins can delete vaults" 
ON public.vaults 
FOR DELETE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can delete their own vaults
CREATE POLICY "Owners can delete their own vaults" 
ON public.vaults 
FOR DELETE 
TO authenticated
USING (owner_id = auth.uid());