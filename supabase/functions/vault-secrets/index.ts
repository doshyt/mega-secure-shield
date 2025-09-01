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
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const method = req.method;
    const url = new URL(req.url);
    const vault_id = url.searchParams.get('vault_id');

    if (!vault_id) {
      return new Response(JSON.stringify({ error: 'Vault ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user permissions
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

    // Check vault access
    const { data: vault, error: vaultError } = await supabaseAdmin
      .from('vaults')
      .select('is_open, owner_id, name')
      .eq('id', vault_id)
      .single();

    if (vaultError || !vault) {
      return new Response(JSON.stringify({ error: 'Vault not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isOwner = vault.owner_id === user.id;
    const isAdmin = userRoles.includes('admin');
    const isVaultUser = userRoles.includes('vault_user');

    // Handle different methods
    if (method === 'GET') {
      // All authenticated users can view secrets if they have access to the vault
      if (!isOwner && !isAdmin && !userRoles.includes('viewer') && !isVaultUser) {
        return new Response(JSON.stringify({ error: 'No access to this vault' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: secrets, error: secretsError } = await supabaseAdmin
        .from('vault_secrets')
        .select('*')
        .eq('vault_id', vault_id);

      if (secretsError) {
        console.error('Secrets fetch error:', secretsError);
        return new Response(JSON.stringify({ error: 'Failed to fetch secrets' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ secrets: secrets || [], vault }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      // Only vault_users and admins can add secrets, and vault must be open
      if (!isVaultUser && !isAdmin) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions to add secrets' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!vault.is_open) {
        return new Response(JSON.stringify({ error: 'Vault must be open to add secrets' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { key, value, secret_type = 'text' } = await req.json();

      if (!key || !value) {
        return new Response(JSON.stringify({ error: 'Key and value are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: secret, error: createError } = await supabaseAdmin
        .from('vault_secrets')
        .insert({
          vault_id,
          key,
          value,
          secret_type,
          created_by: user.id
        })
        .select()
        .single();

      if (createError) {
        console.error('Secret creation error:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create secret' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ secret }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vault-secrets function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});