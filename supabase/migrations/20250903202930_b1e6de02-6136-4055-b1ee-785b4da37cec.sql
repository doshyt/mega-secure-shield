-- Fix search path for existing functions to resolve security warning
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
    
    -- Assign default viewer role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
    
    RETURN NEW;
END;
$$;