-- Enable Row Level Security on vault_secrets table
ALTER TABLE public.vault_secrets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS TEXT AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = user_uuid LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Policy: Admins can view all vault secrets
CREATE POLICY "Admins can view all vault secrets" 
ON public.vault_secrets 
FOR SELECT 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can view their vault secrets when vault is open
CREATE POLICY "Owners can view their vault secrets when open" 
ON public.vault_secrets 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vaults 
    WHERE vaults.id = vault_secrets.vault_id 
    AND vaults.owner_id = auth.uid() 
    AND (vaults.is_open = true OR public.get_user_role(auth.uid()) = 'admin')
  )
);

-- Policy: Vault users can view vault secrets when vault is open
CREATE POLICY "Vault users can view vault secrets when open" 
ON public.vault_secrets 
FOR SELECT 
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'vault_user' 
  AND EXISTS (
    SELECT 1 FROM public.vaults 
    WHERE vaults.id = vault_secrets.vault_id 
    AND vaults.is_open = true
  )
);

-- Policy: Admins can insert vault secrets
CREATE POLICY "Admins can insert vault secrets" 
ON public.vault_secrets 
FOR INSERT 
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can insert secrets to their vaults when open
CREATE POLICY "Owners can insert secrets to their open vaults" 
ON public.vault_secrets 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vaults 
    WHERE vaults.id = vault_secrets.vault_id 
    AND vaults.owner_id = auth.uid() 
    AND vaults.is_open = true
  )
  AND created_by = auth.uid()
);

-- Policy: Vault users can insert secrets when vault is open
CREATE POLICY "Vault users can insert secrets when vault is open" 
ON public.vault_secrets 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.get_user_role(auth.uid()) = 'vault_user' 
  AND EXISTS (
    SELECT 1 FROM public.vaults 
    WHERE vaults.id = vault_secrets.vault_id 
    AND vaults.is_open = true
  )
  AND created_by = auth.uid()
);

-- Policy: Admins can update all vault secrets
CREATE POLICY "Admins can update all vault secrets" 
ON public.vault_secrets 
FOR UPDATE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can update their vault secrets when open
CREATE POLICY "Owners can update their vault secrets when open" 
ON public.vault_secrets 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vaults 
    WHERE vaults.id = vault_secrets.vault_id 
    AND vaults.owner_id = auth.uid() 
    AND vaults.is_open = true
  )
);

-- Policy: Vault users can update vault secrets when open
CREATE POLICY "Vault users can update vault secrets when open" 
ON public.vault_secrets 
FOR UPDATE 
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'vault_user' 
  AND EXISTS (
    SELECT 1 FROM public.vaults 
    WHERE vaults.id = vault_secrets.vault_id 
    AND vaults.is_open = true
  )
);

-- Policy: Admins can delete vault secrets
CREATE POLICY "Admins can delete vault secrets" 
ON public.vault_secrets 
FOR DELETE 
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Policy: Vault owners can delete their vault secrets when open
CREATE POLICY "Owners can delete their vault secrets when open" 
ON public.vault_secrets 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vaults 
    WHERE vaults.id = vault_secrets.vault_id 
    AND vaults.owner_id = auth.uid() 
    AND vaults.is_open = true
  )
);