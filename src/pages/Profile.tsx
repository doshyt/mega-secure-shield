import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, User, ArrowLeft, Save, Mail, Calendar, Crown, Eye, Vault as VaultIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';

interface ProfileData {
  id: string;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface ProfileForm {
  display_name: string;
  avatar_url: string;
}

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm<ProfileForm>();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
    fetchUserRoles();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
      if (data) {
        setValue('display_name', data.display_name || '');
        setValue('avatar_url', data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error loading profile",
        description: "Failed to load your profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setUserRoles(data.map(r => r.role));
    } catch (error) {
      console.error('Error fetching user roles:', error);
    }
  };

  const onUpdateProfile = async (data: ProfileForm) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: data.display_name,
          avatar_url: data.avatar_url
        });

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated"
      });

      fetchProfile();
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: "Failed to update your profile",
        variant: "destructive"
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3" />;
      case 'vault_user':
        return <VaultIcon className="w-3 h-3" />;
      case 'viewer':
        return <Eye className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'vault_user':
        return 'default';
      case 'viewer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-security-border bg-security-surface">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-accent" />
                <span className="text-xl font-bold text-foreground">Profile Settings</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Profile Overview */}
          <Card className="bg-gradient-card border-security-border shadow-card">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-security-surface text-accent">
                    {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-foreground">
                    {profile?.display_name || 'No display name set'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Joined {profile ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">User Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {userRoles.length > 0 ? (
                      userRoles.map(role => (
                        <Badge 
                          key={role} 
                          variant={getRoleColor(role) as any}
                          className="flex items-center space-x-1"
                        >
                          {getRoleIcon(role)}
                          <span className="capitalize">{role}</span>
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No roles assigned</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Form */}
          <Card className="bg-gradient-card border-security-border shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Edit Profile</CardTitle>
              <CardDescription className="text-muted-foreground">
                Update your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    placeholder="Enter your display name"
                    {...register('display_name')}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar_url">Avatar URL</Label>
                  <Input
                    id="avatar_url"
                    placeholder="Enter avatar image URL"
                    {...register('avatar_url')}
                    className="bg-input border-border"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card className="bg-gradient-card border-security-border shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Account Information</CardTitle>
              <CardDescription className="text-muted-foreground">
                View your account details and security information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-security-surface rounded-lg border border-security-border">
                  <div>
                    <Label className="text-sm font-medium text-foreground">User ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">{user?.id}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-security-surface rounded-lg border border-security-border">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {profile ? new Date(profile.updated_at).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-security-surface rounded-lg border border-security-border">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Account Status</Label>
                    <p className="text-sm text-accent">Active</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;