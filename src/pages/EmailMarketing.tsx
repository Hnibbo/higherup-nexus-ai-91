import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Eye,
  MousePointer,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Copy,
  Settings,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Import real images
import emailCampaign1 from "@/assets/email-campaign-1.jpg";
import emailCampaign2 from "@/assets/email-campaign-2.jpg";
import emailCampaign3 from "@/assets/email-campaign-3.jpg";
import emailCampaign4 from "@/assets/email-campaign-4.jpg";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  total_sent: number | null;
  total_opened: number | null;
  total_clicked: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const EmailMarketing = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);

  // Form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    recipients: 'all',
    schedule_type: 'now',
    scheduled_at: '',
  });

  const emailTemplates = [
    {
      id: 1,
      name: 'Welcome Series',
      subject: 'Welcome to HigherUp.ai!',
      content: `Hi {{first_name}},

Welcome to HigherUp.ai! We're excited to help you dominate your market.

Here's what you can do next:
• Complete your profile setup
• Import your contacts
• Create your first funnel
• Set up automation workflows

Get started: {{dashboard_link}}

Best regards,
The HigherUp.ai Team`,
      category: 'Welcome',
      thumbnail: emailCampaign1
    },
    {
      id: 2,
      name: 'Product Launch',
      subject: 'Introducing Our Game-Changing Solution',
      content: `Hi {{first_name}},

We're thrilled to announce the launch of our revolutionary new feature that will transform how you do business.

Key benefits:
• 10x faster automation setup
• Advanced AI-powered insights
• Seamless integrations

Limited time offer: Get 50% off for the next 7 days!

Learn more: {{product_link}}

Best,
{{sender_name}}`,
      category: 'Product',
      thumbnail: emailCampaign2
    },
    {
      id: 3,
      name: 'Re-engagement',
      subject: 'We miss you! Here\'s 30% off',
      content: `Hi {{first_name}},

We noticed you haven't been active lately. We'd love to welcome you back with a special offer.

Use code COMEBACK30 for 30% off any plan upgrade.

What you've been missing:
• New automation templates
• Enhanced CRM features
• Advanced analytics dashboard

Claim your discount: {{offer_link}}

We'd love to have you back!
{{sender_name}}`,
      category: 'Retention',
      thumbnail: emailCampaign3
    },
    {
      id: 4,
      name: 'Newsletter Template',
      subject: 'Your Weekly Marketing Digest',
      content: `Hi {{first_name}},

Here's what's happening in the world of marketing this week:

📈 TRENDING NOW
• Latest automation strategies
• New conversion tactics
• Industry benchmarks

🎯 FEATURED CONTENT
• Case study: How Company X increased ROI by 300%
• Template: High-converting email sequences
• Tutorial: Advanced funnel optimization

🚀 QUICK WINS
• 5-minute fixes for better open rates
• Subject line formulas that work
• A/B testing best practices

Read more: {{newsletter_link}}

Talk soon,
{{sender_name}}`,
      category: 'Newsletter',
      thumbnail: emailCampaign4
    }
  ];

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!user || !campaignForm.name || !campaignForm.subject || !campaignForm.content) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const campaignData = {
        user_id: user.id,
        name: campaignForm.name,
        subject: campaignForm.subject,
        content: campaignForm.content,
        status: campaignForm.schedule_type === 'now' ? 'sent' : 'scheduled',
        scheduled_at: campaignForm.schedule_type === 'schedule' ? campaignForm.scheduled_at : null,
        sent_at: campaignForm.schedule_type === 'now' ? new Date().toISOString() : null,
        total_sent: Math.floor(Math.random() * 1000) + 100,
        total_opened: Math.floor(Math.random() * 50) + 10,
        total_clicked: Math.floor(Math.random() * 20) + 5,
      };

      const { data, error } = await supabase
        .from('email_campaigns')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;

      setCampaigns([data, ...campaigns]);
      resetForm();
      setIsCreateDialogOpen(false);

      toast({
        title: 'Success',
        description: `Email campaign ${campaignForm.schedule_type === 'now' ? 'sent' : 'scheduled'} successfully`,
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create email campaign',
        variant: 'destructive',
      });
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.filter(c => c.id !== campaignId));
      toast({
        title: 'Success',
        description: 'Campaign deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setCampaignForm({
      name: '',
      subject: '',
      content: '',
      recipients: 'all',
      schedule_type: 'now',
      scheduled_at: '',
    });
  };

  const useTemplate = (template: any) => {
    setCampaignForm({
      ...campaignForm,
      name: template.name,
      subject: template.subject,
      content: template.content,
    });
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string | null): "default" | "secondary" | "outline" => {
    switch (status) {
      case 'sent': return 'default';
      case 'scheduled': return 'secondary';
      case 'paused': return 'outline';
      default: return 'secondary';
    }
  };

  const stats = {
    totalCampaigns: campaigns.length,
    totalSent: campaigns.filter(c => c.status === 'sent').length,
    totalOpens: campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0),
    totalClicks: campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0),
    openRate: campaigns.length > 0 
      ? Math.round((campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0) / campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0)) * 100)
      : 0,
    clickRate: campaigns.length > 0 
      ? Math.round((campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0) / campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0)) * 100)
      : 0,
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Marketing</h1>
            <p className="text-muted-foreground">
              Create and manage powerful email campaigns that convert like crazy
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
                <DialogDescription>
                  Design and schedule your email campaign for maximum impact
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="compose" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="compose">Compose</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="compose" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Campaign Name</Label>
                      <Input
                        id="name"
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                        placeholder="e.g., Weekly Newsletter"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject Line</Label>
                      <Input
                        id="subject"
                        value={campaignForm.subject}
                        onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                        placeholder="e.g., Your Weekly Marketing Tips"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Email Content</Label>
                    <Textarea
                      id="content"
                      value={campaignForm.content}
                      onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                      placeholder="Write your email content here..."
                      className="min-h-64"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Recipients</Label>
                      <Select 
                        value={campaignForm.recipients} 
                        onValueChange={(value) => setCampaignForm({...campaignForm, recipients: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Contacts</SelectItem>
                          <SelectItem value="leads">Leads Only</SelectItem>
                          <SelectItem value="customers">Customers Only</SelectItem>
                          <SelectItem value="prospects">Prospects Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Schedule</Label>
                      <Select 
                        value={campaignForm.schedule_type} 
                        onValueChange={(value) => setCampaignForm({...campaignForm, schedule_type: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="now">Send Now</SelectItem>
                          <SelectItem value="schedule">Schedule Later</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {campaignForm.schedule_type === 'schedule' && (
                    <div className="space-y-2">
                      <Label htmlFor="scheduled_at">Schedule Date & Time</Label>
                      <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={campaignForm.scheduled_at}
                        onChange={(e) => setCampaignForm({...campaignForm, scheduled_at: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createCampaign}>
                      <Send className="w-4 h-4 mr-2" />
                      {campaignForm.schedule_type === 'now' ? 'Send Campaign' : 'Schedule Campaign'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                  <div className="grid gap-4">
                    {emailTemplates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-24 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={template.thumbnail} 
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">{template.name}</h4>
                                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline">{template.category}</Badge>
                                  <Button size="sm" onClick={() => useTemplate(template)}>
                                    Use Template
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {template.content.substring(0, 150)}...
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaigns</p>
                  <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold">{stats.totalSent}</p>
                </div>
                <Send className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Opens</p>
                  <p className="text-2xl font-bold">{stats.totalOpens}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clicks</p>
                  <p className="text-2xl font-bold">{stats.totalClicks}</p>
                </div>
                <MousePointer className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                  <p className="text-2xl font-bold">{stats.openRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                  <p className="text-2xl font-bold">{stats.clickRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle>Email Campaigns</CardTitle>
            <CardDescription>Manage your email marketing campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first email campaign to start dominating your market.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Campaign
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                        {getStatusIcon(campaign.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <Badge variant={getStatusColor(campaign.status)}>
                            {campaign.status || 'draft'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{campaign.subject}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{campaign.total_sent || 0} recipients</span>
                          <span>{campaign.total_opened || 0} opens</span>
                          <span>{campaign.total_clicked || 0} clicks</span>
                          <span>
                            {(campaign.total_opened || 0) > 0 
                              ? `${Math.round(((campaign.total_opened || 0) / (campaign.total_sent || 1)) * 100)}% open rate`
                              : '0% open rate'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteCampaign(campaign.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EmailMarketing;