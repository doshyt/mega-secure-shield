import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Plus, Vault, Lock, Unlock, User, LogOut, Settings, Eye, EyeOff, Key, FileText, Edit, Trash2, Copy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';

interface VaultData {
  id: string;
  name: string;
  description?: string;
  is_open: boolean;
  owner_id: string;
  created_at: string;
}

interface VaultSecret {
  id: string;
  key: string;
  value: string;
  secret_type: string;
  created_at: string;
  created_by: string;
}

interface CreateVaultForm {
  name: string;
  description: string;
}

interface CreateSecretForm {
  key: string;
  value: string;
  secret_type: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [selectedVault, setSelectedVault] = useState<VaultData | null>(null);
  const [vaultSecrets, setVaultSecrets] = useState<VaultSecret[]>([]);
  const [secretsLoading, setSecretsLoading] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<CreateVaultForm>();
  const { register: registerSecret, handleSubmit: handleSecretSubmit, reset: resetSecret, formState: { isSubmitting: isSubmittingSecret } } = useForm<CreateSecretForm>();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchVaults();
    fetchUserRoles();
  }, [user, navigate]);

  const fetchVaults = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('vault-list');
      if (error) throw error;
      setVaults(data?.vaults || []);
    } catch (error) {
      toast({
        title: "Error fetching vaults",
        description: "Failed to load your vaults",
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

  const canCreateVaults = userRoles.includes('admin') || userRoles.includes('vault_user');
  const canOpenVaults = userRoles.includes('admin') || userRoles.includes('vault_user');

  const onCreateVault = async (data: CreateVaultForm) => {
    try {
      const { error } = await supabase.functions.invoke('vault-create', {
        body: data
      });
      
      if (error) throw error;
      
      toast({
        title: "Vault created",
        description: `Successfully created vault "${data.name}"`
      });
      
      reset();
      fetchVaults();
    } catch (error) {
      toast({
        title: "Error creating vault",
        description: "Failed to create vault",
        variant: "destructive"
      });
    }
  };

  const toggleVault = async (vaultId: string, currentState: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('vault-toggle', {
        body: { vault_id: vaultId }
      });
      
      if (error) throw error;
      
      toast({
        title: currentState ? "Vault closed" : "Vault opened",
        description: `Vault has been ${currentState ? 'closed' : 'opened'} successfully`
      });
      
      fetchVaults();
    } catch (error) {
      toast({
        title: "Error toggling vault",
        description: "Failed to change vault state",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const fetchVaultSecrets = async (vaultId: string) => {
    setSecretsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('vault-secrets', {
        body: { vault_id: vaultId }
      });
      if (error) throw error;
      setVaultSecrets(data || []);
    } catch (error) {
      toast({
        title: "Error fetching secrets",
        description: "Failed to load vault secrets",
        variant: "destructive"
      });
    } finally {
      setSecretsLoading(false);
    }
  };

  const onCreateSecret = async (data: CreateSecretForm) => {
    if (!selectedVault) return;
    
    try {
      const { error } = await supabase.functions.invoke('vault-secrets', {
        body: {
          vault_id: selectedVault.id,
          key: data.key,
          value: data.value,
          secret_type: data.secret_type || 'text'
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Secret added",
        description: `Successfully added secret "${data.key}"`
      });
      
      resetSecret();
      fetchVaultSecrets(selectedVault.id);
    } catch (error) {
      toast({
        title: "Error adding secret",
        description: "Failed to add secret to vault",
        variant: "destructive"
      });
    }
  };

  const toggleSecretVisibility = (secretId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(secretId)) {
      newVisible.delete(secretId);
    } else {
      newVisible.add(secretId);
    }
    setVisibleSecrets(newVisible);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Secret value copied successfully"
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const openVaultDetails = (vault: VaultData) => {
    setSelectedVault(vault);
    if (vault.is_open) {
      fetchVaultSecrets(vault.id);
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
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-accent" />
              <span className="text-xl font-bold text-foreground">Vault Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user?.email}</span>
                <div className="flex gap-1">
                  {userRoles.map(role => (
                    <Badge key={role} variant="secondary" className="text-xs">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Vaults</h1>
            <p className="text-muted-foreground">Manage your secure digital vaults</p>
          </div>
          
          {canCreateVaults && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="shadow-glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Vault
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gradient-card border-security-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Vault</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Create a new secure vault to store your digital secrets
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onCreateVault)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vault Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter vault name"
                      {...register('name', { required: true })}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Enter vault description"
                      {...register('description')}
                      className="bg-input border-border"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <>
                        <Vault className="w-4 h-4 mr-2" />
                        Create Vault
                      </>
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Vaults Grid */}
        {vaults.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaults.map((vault) => (
              <Card key={vault.id} className="bg-gradient-card border-security-border shadow-card hover:shadow-accent transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center space-x-2">
                      <Vault className="w-5 h-5" />
                      <span>{vault.name}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={vault.is_open ? "destructive" : "secondary"}>
                        {vault.is_open ? (
                          <>
                            <Unlock className="w-3 h-3 mr-1" />
                            Open
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 mr-1" />
                            Closed
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                  {vault.description && (
                    <CardDescription className="text-muted-foreground">
                      {vault.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted-foreground">
                      Created {new Date(vault.created_at).toLocaleDateString()}
                    </span>
                    {canOpenVaults && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVault(vault.id, vault.is_open)}
                      >
                        {vault.is_open ? (
                          <>
                            <Lock className="w-4 h-4 mr-1" />
                            Close
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-1" />
                            Open
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => openVaultDetails(vault)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-2xl bg-gradient-card border-security-border">
                        <SheetHeader>
                          <SheetTitle className="text-foreground flex items-center space-x-2">
                            <Vault className="w-5 h-5" />
                            <span>{selectedVault?.name}</span>
                            <Badge variant={selectedVault?.is_open ? "destructive" : "secondary"}>
                              {selectedVault?.is_open ? "Open" : "Closed"}
                            </Badge>
                          </SheetTitle>
                          <SheetDescription className="text-muted-foreground">
                            {selectedVault?.description || "Manage your vault secrets and settings"}
                          </SheetDescription>
                        </SheetHeader>

                        <div className="mt-6 space-y-6">
                          {selectedVault?.is_open ? (
                            <>
                              {/* Add Secret Form */}
                              {(canOpenVaults || userRoles.includes('vault_user')) && (
                                <Card className="bg-security-surface border-border">
                                  <CardHeader>
                                    <CardTitle className="text-lg text-foreground">Add New Secret</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <form onSubmit={handleSecretSubmit(onCreateSecret)} className="space-y-4">
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="secret-key">Key</Label>
                                          <Input
                                            id="secret-key"
                                            placeholder="e.g., API_KEY"
                                            {...registerSecret('key', { required: true })}
                                            className="bg-input border-border"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="secret-type">Type</Label>
                                          <Select {...registerSecret('secret_type')}>
                                            <SelectTrigger className="bg-input border-border">
                                              <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="text">Text</SelectItem>
                                              <SelectItem value="password">Password</SelectItem>
                                              <SelectItem value="api_key">API Key</SelectItem>
                                              <SelectItem value="certificate">Certificate</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="secret-value">Value</Label>
                                        <Textarea
                                          id="secret-value"
                                          placeholder="Enter secret value"
                                          {...registerSecret('value', { required: true })}
                                          className="bg-input border-border"
                                        />
                                      </div>
                                      <Button type="submit" disabled={isSubmittingSecret} className="w-full">
                                        {isSubmittingSecret ? (
                                          <div className="flex items-center space-x-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                                            <span>Adding...</span>
                                          </div>
                                        ) : (
                                          <>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Secret
                                          </>
                                        )}
                                      </Button>
                                    </form>
                                  </CardContent>
                                </Card>
                              )}

                              <Separator />

                              {/* Secrets List */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-lg font-semibold text-foreground">Vault Secrets</h3>
                                  {secretsLoading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                                  )}
                                </div>
                                
                                {vaultSecrets.length > 0 ? (
                                  <div className="space-y-3">
                                    {vaultSecrets.map((secret) => (
                                      <Card key={secret.id} className="bg-security-surface border-border">
                                        <CardContent className="pt-4">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-2">
                                              <Key className="w-4 h-4 text-accent" />
                                              <span className="font-medium text-foreground">{secret.key}</span>
                                              <Badge variant="outline" className="text-xs">
                                                {secret.secret_type}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleSecretVisibility(secret.id)}
                                              >
                                                {visibleSecrets.has(secret.id) ? (
                                                  <EyeOff className="w-4 h-4" />
                                                ) : (
                                                  <Eye className="w-4 h-4" />
                                                )}
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(secret.value)}
                                              >
                                                <Copy className="w-4 h-4" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="bg-input border border-border rounded-md p-3">
                                            <code className="text-sm text-muted-foreground break-all">
                                              {visibleSecrets.has(secret.id) 
                                                ? secret.value 
                                                : '•'.repeat(Math.min(secret.value.length, 20))
                                              }
                                            </code>
                                          </div>
                                          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                            <span>Created {new Date(secret.created_at).toLocaleDateString()}</span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                ) : (
                                  <Card className="bg-security-surface border-border text-center py-8">
                                    <CardContent>
                                      <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                      <CardTitle className="text-sm text-foreground mb-2">No Secrets Found</CardTitle>
                                      <CardDescription className="text-muted-foreground">
                                        This vault is empty. Add your first secret above.
                                      </CardDescription>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            </>
                          ) : (
                            <Alert>
                              <Lock className="h-4 w-4" />
                              <AlertDescription>
                                This vault is closed. Open the vault to view and manage secrets.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-gradient-card border-security-border shadow-card text-center py-12">
            <CardContent>
              <Vault className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <CardTitle className="text-xl text-foreground mb-2">No Vaults Found</CardTitle>
              <CardDescription className="text-muted-foreground mb-4">
                {canCreateVaults 
                  ? "Create your first vault to start storing secure data"
                  : "You don't have access to any vaults yet. Contact an administrator for access."
                }
              </CardDescription>
              {canCreateVaults && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="shadow-glow">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Vault
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gradient-card border-security-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Create New Vault</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Create a new secure vault to store your digital secrets
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onCreateVault)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Vault Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter vault name"
                          {...register('name', { required: true })}
                          className="bg-input border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Enter vault description"
                          {...register('description')}
                          className="bg-input border-border"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                            <span>Creating...</span>
                          </div>
                        ) : (
                          <>
                            <Vault className="w-4 h-4 mr-2" />
                            Create Vault
                          </>
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;