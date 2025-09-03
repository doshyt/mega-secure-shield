import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.log('🚫 [VAULT-LIST] Authentication failed:', { authError, hasUser: !!user });
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔐 [VAULT-LIST] Function invoked by user:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Get user roles
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(JSON.stringify({ error: 'Failed to check permissions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userRoles = roles?.map(r => r.role) || [];
    const isAdmin = userRoles.includes('admin');

    console.log('👤 [VAULT-LIST] User context and roles:', {
      userId: user.id,
      userEmail: user.email,
      userRoles: userRoles,
      isAdmin: isAdmin,
      operation: 'list_vaults'
    });

    // Get vaults based on role
    let query = supabaseAdmin.from('vaults').select('*');
    
    if (!isAdmin) {
      // Non-admin users can only see their own vaults
      console.log('🔒 [VAULT-LIST] Filtering to user-owned vaults only (non-admin):', {
        userId: user.id,
        userRoles: userRoles
      });
      query = query.eq('owner_id', user.id);
    } else {
      console.log('🔓 [VAULT-LIST] Admin access - showing all vaults:', {
        userId: user.id,
        userRoles: userRoles
      });
    }

    const { data: vaults, error: vaultError } = await query;

    if (vaultError) {
      console.error('Vault fetch error:', vaultError);
      return new Response(JSON.stringify({ error: 'Failed to fetch vaults' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ vaults: vaults || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vault-list function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});