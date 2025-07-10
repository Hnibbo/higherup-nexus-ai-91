import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { TeamManagement } from '@/components/Team/TeamManagement';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Users, 
  Palette, 
  Settings as SettingsIcon,
  Crown,
  Globe,
  Mail,
  Phone,
  Building,
  Camera
} from 'lucide-react';

const Settings = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    company_name: profile?.company_name || '',
    phone: profile?.phone || '',
  });

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await updateProfile(profileData);
      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been successfully updated.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground text-lg">
              Manage your account settings and preferences
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Billing</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Team</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Branding</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account information and personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Upload a profile picture (JPG, PNG up to 2MB)
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={user?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input
                        id="company_name"
                        value={profileData.company_name}
                        onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                        placeholder="Your company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="flex items-center space-x-2">
                        <Crown className="w-3 h-3" />
                        <span>{profile?.plan_type || 'Starter'} Plan</span>
                      </Badge>
                      <Badge variant="secondary">
                        {profile?.ai_credits_remaining || 0} AI Credits
                      </Badge>
                    </div>
                    <Button onClick={handleProfileUpdate} disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose how you want to be notified about important events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive important updates via email
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Get tips, product updates, and special offers
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Weekly Reports</Label>
                        <p className="text-sm text-muted-foreground">
                          Weekly summary of your account activity
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Real-time notifications in your browser
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      Manage your subscription and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold capitalize">
                          {profile?.plan_type || 'Starter'} Plan
                        </h3>
                        <p className="text-muted-foreground">
                          {profile?.plan_type === 'starter' && '$47/month'}
                          {profile?.plan_type === 'professional' && '$97/month'}
                          {profile?.plan_type === 'agency' && '$297/month'}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline">Change Plan</Button>
                        <Button>Manage Billing</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usage & Credits</CardTitle>
                    <CardDescription>
                      Track your current usage and available credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {profile?.ai_credits_remaining || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">AI Credits Remaining</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">∞</div>
                        <div className="text-sm text-muted-foreground">Contacts</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">∞</div>
                        <div className="text-sm text-muted-foreground">Email Sends</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="team">
              <TeamManagement />
            </TabsContent>

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>White Label Settings</CardTitle>
                  <CardDescription>
                    Customize the platform with your branding
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">White Label Branding</h3>
                    <p className="mb-4">Available on Professional and Agency plans</p>
                    <Button>Upgrade to Unlock</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Password & Authentication</CardTitle>
                    <CardDescription>
                      Secure your account with strong authentication
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add extra security to your account
                        </p>
                      </div>
                      <Button variant="outline">Enable 2FA</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Change Password</Label>
                        <p className="text-sm text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                      <Button variant="outline">Change Password</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Security</CardTitle>
                    <CardDescription>
                      Monitor and control account access
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">Active Sessions</Label>
                        <p className="text-sm text-muted-foreground">
                          View and manage your active sessions
                        </p>
                      </div>
                      <Button variant="outline">View Sessions</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base">API Keys</Label>
                        <p className="text-sm text-muted-foreground">
                          Manage your API access keys
                        </p>
                      </div>
                      <Button variant="outline">Manage Keys</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
};

export default Settings;