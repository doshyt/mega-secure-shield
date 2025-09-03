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
      console.log('🚫 [USER-MANAGEMENT] Authentication failed:', { authError, hasUser: !!user });
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔐 [USER-MANAGEMENT] Function invoked by user:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    const method = req.method;
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Check if user is admin for user management operations
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

    console.log('👤 [USER-MANAGEMENT] User context and roles:', {
      userId: user.id,
      userEmail: user.email,
      userRoles: userRoles,
      isAdmin: isAdmin,
      requestedAction: action,
      method: method
    });

    if (method === 'GET' && action === 'list') {
      // Only admins can list all users
      if (!isAdmin) {
        console.log('❌ [USER-MANAGEMENT] ACCESS DENIED - List users:', {
          userId: user.id,
          userRoles: userRoles,
          requiredRole: 'admin',
          hasPermission: false
        });
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ [USER-MANAGEMENT] ACCESS GRANTED - List users:', {
        userId: user.id,
        userRoles: userRoles,
        operation: 'list_users'
      });

      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          user_roles (role)
        `);

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ users: profiles || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST' && action === 'assign-role') {
      // Only admins can assign roles
      if (!isAdmin) {
        console.log('❌ [USER-MANAGEMENT] ACCESS DENIED - Assign role:', {
          userId: user.id,
          userRoles: userRoles,
          requiredRole: 'admin',
          hasPermission: false
        });
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ [USER-MANAGEMENT] ACCESS GRANTED - Assign role:', {
        userId: user.id,
        userRoles: userRoles,
        operation: 'assign_role'
      });

      const { user_id, role } = await req.json();

      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: 'User ID and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate role
      const validRoles = ['admin', 'vault_user', 'viewer'];
      if (!validRoles.includes(role)) {
        return new Response(JSON.stringify({ error: 'Invalid role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert new role (will handle conflicts via unique constraint)
      const { data: newRole, error: roleInsertError } = await supabaseAdmin
        .from('user_roles')
        .insert({ user_id, role })
        .select()
        .single();

      if (roleInsertError) {
        // If role already exists, that's okay
        if (roleInsertError.code === '23505') {
          return new Response(JSON.stringify({ message: 'Role already assigned' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        console.error('Role assignment error:', roleInsertError);
        return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ role: newRole }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE' && action === 'remove-role') {
      // Only admins can remove roles
      if (!isAdmin) {
        console.log('❌ [USER-MANAGEMENT] ACCESS DENIED - Remove role:', {
          userId: user.id,
          userRoles: userRoles,
          requiredRole: 'admin',
          hasPermission: false
        });
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('✅ [USER-MANAGEMENT] ACCESS GRANTED - Remove role:', {
        userId: user.id,
        userRoles: userRoles,
        operation: 'remove_role'
      });

      const { user_id, role } = await req.json();

      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: 'User ID and role are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error: deleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', user_id)
        .eq('role', role);

      if (deleteError) {
        console.error('Role removal error:', deleteError);
        return new Response(JSON.stringify({ error: 'Failed to remove role' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: 'Role removed successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action or method' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in user-management function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});