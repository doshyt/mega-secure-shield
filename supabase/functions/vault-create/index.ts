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
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create supabase client with service role for DB operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create client with anon key to verify user
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.log('🚫 [VAULT-CREATE] Authentication failed:', { authError, hasUser: !!user });
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔐 [VAULT-CREATE] Function invoked by user:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Check if user has admin or vault_user role
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
    const canCreateVault = userRoles.includes('admin') || userRoles.includes('vault_user');

    console.log('👤 [VAULT-CREATE] User context and roles:', {
      userId: user.id,
      userEmail: user.email,
      userRoles: userRoles,
      canCreateVault: canCreateVault,
      requiredRoles: ['admin', 'vault_user']
    });

    if (!canCreateVault) {
      console.log('❌ [VAULT-CREATE] ACCESS DENIED - Create vault:', {
        userId: user.id,
        userRoles: userRoles,
        requiredRoles: ['admin', 'vault_user'],
        hasPermission: false
      });
      return new Response(JSON.stringify({ error: 'Insufficient permissions to create vault' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [VAULT-CREATE] ACCESS GRANTED - Create vault:', {
      userId: user.id,
      userRoles: userRoles,
      operation: 'create_vault'
    });

    // Get request body
    const { name, description } = await req.json();

    if (!name) {
      return new Response(JSON.stringify({ error: 'Vault name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create vault using service role
    const { data: vault, error: createError } = await supabaseAdmin
      .from('vaults')
      .insert({
        name,
        description,
        owner_id: user.id,
        is_open: false
      })
      .select()
      .single();

    if (createError) {
      console.error('Vault creation error:', createError);
      return new Response(JSON.stringify({ error: 'Failed to create vault' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ vault }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vault-create function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});