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
      console.log('🚫 [VAULT-TOGGLE] Authentication failed:', { authError, hasUser: !!user });
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔐 [VAULT-TOGGLE] Function invoked by user:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    const { vault_id } = await req.json();

    if (!vault_id) {
      return new Response(JSON.stringify({ error: 'Vault ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has permission to toggle vault
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
    const canToggleVault = userRoles.includes('admin') || userRoles.includes('vault_user');

    console.log('👤 [VAULT-TOGGLE] User context and roles:', {
      userId: user.id,
      userEmail: user.email,
      userRoles: userRoles,
      canToggleVault: canToggleVault,
      requestedVault: vault_id,
      requiredRoles: ['admin', 'vault_user']
    });

    if (!canToggleVault) {
      console.log('❌ [VAULT-TOGGLE] ACCESS DENIED - Toggle vault:', {
        userId: user.id,
        userRoles: userRoles,
        requiredRoles: ['admin', 'vault_user'],
        hasPermission: false
      });
      return new Response(JSON.stringify({ error: 'Insufficient permissions to toggle vault' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [VAULT-TOGGLE] ACCESS GRANTED - Toggle vault permissions check passed:', {
      userId: user.id,
      userRoles: userRoles,
      operation: 'toggle_vault'
    });

    // Get current vault state
    const { data: vault, error: fetchError } = await supabaseAdmin
      .from('vaults')
      .select('is_open, owner_id')
      .eq('id', vault_id)
      .single();

    if (fetchError || !vault) {
      return new Response(JSON.stringify({ error: 'Vault not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is owner or admin
    const isOwner = vault.owner_id === user.id;
    const isAdmin = userRoles.includes('admin');

    console.log('🔑 [VAULT-TOGGLE] Ownership check:', {
      userId: user.id,
      vaultOwnerId: vault.owner_id,
      isOwner: isOwner,
      isAdmin: isAdmin,
      vaultId: vault_id
    });

    if (!isOwner && !isAdmin) {
      console.log('❌ [VAULT-TOGGLE] ACCESS DENIED - Not owner or admin:', {
        userId: user.id,
        vaultOwnerId: vault.owner_id,
        isOwner: isOwner,
        isAdmin: isAdmin,
        hasPermission: false
      });
      return new Response(JSON.stringify({ error: 'You can only toggle your own vaults' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [VAULT-TOGGLE] FINAL ACCESS GRANTED - Toggle vault:', {
      userId: user.id,
      isOwner: isOwner,
      isAdmin: isAdmin,
      operation: 'toggle_vault_final'
    });

    // Toggle vault state
    const { data: updatedVault, error: updateError } = await supabaseAdmin
      .from('vaults')
      .update({ 
        is_open: !vault.is_open,
        updated_at: new Date().toISOString()
      })
      .eq('id', vault_id)
      .select()
      .single();

    if (updateError) {
      console.error('Vault update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to toggle vault' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ vault: updatedVault }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vault-toggle function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});