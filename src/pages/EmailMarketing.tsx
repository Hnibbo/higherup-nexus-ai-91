import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EmailCampaignForm from "@/components/EmailCampaignForm";
import emailCampaign1 from "@/assets/email-campaign-1.jpg";
import emailCampaign2 from "@/assets/email-campaign-2.jpg";
import emailCampaign3 from "@/assets/email-campaign-3.jpg";
import emailCampaign4 from "@/assets/email-campaign-4.jpg";
import { 
  Mail, 
  Send, 
  Users, 
  Calendar,
  BarChart3,
  Zap,
  Plus,
  Play,
  Pause,
  Settings,
  Target,
  Clock,
  TrendingUp,
  Eye,
  MousePointer,
  MessageSquare,
  Phone,
  Filter,
  Search,
  Download,
  Upload,
  Copy,
  Edit3,
  Trash2
} from "lucide-react";

const EmailMarketing = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignFormOpen, setCampaignFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sample campaigns data
  const [campaignStats] = useState([
    {
      id: 1,
      name: "Welcome Series",
      status: "active",
      sent: 2847,
      opens: 1278,
      clicks: 342,
      openRate: "44.9%",
      clickRate: "12.0%",
      lastSent: "2 hours ago",
      nextSend: "Tomorrow 9:00 AM"
    },
    {
      id: 2,
      name: "Product Launch Campaign",
      status: "scheduled",
      sent: 0,
      opens: 0,
      clicks: 0,
      openRate: "0%",
      clickRate: "0%",
      lastSent: "Not sent",
      nextSend: "Friday 2:00 PM"
    },
    {
      id: 3,
      name: "Monthly Newsletter",
      status: "completed",
      sent: 5632,
      opens: 2954,
      clicks: 887,
      openRate: "52.4%",
      clickRate: "15.7%",
      lastSent: "Last week",
      nextSend: "Next month"
    }
  ]);

  const templates = [
    {
      id: 1,
      name: "Welcome Series",
      category: "Onboarding",
      opens: "45%",
      clicks: "12%",
      thumbnail: emailCampaign1,
      description: "Perfect first impression for new subscribers"
    },
    {
      id: 2,
      name: "Product Launch",
      category: "Promotion",
      opens: "52%",
      clicks: "18%",
      thumbnail: emailCampaign2,
      description: "Announce new products with style"
    },
    {
      id: 3,
      name: "Newsletter Modern",
      category: "Newsletter",
      opens: "38%",
      clicks: "8%",
      thumbnail: emailCampaign3,
      description: "Clean and professional newsletter design"
    },
    {
      id: 4,
      name: "Holiday Sale",
      category: "Promotion",
      opens: "61%",
      clicks: "25%",
      thumbnail: emailCampaign4,
      description: "Eye-catching holiday promotion template"
    }
  ];

  const [automations] = useState([
    {
      id: 1,
      name: "Welcome Sequence",
      trigger: "New Subscriber",
      emails: 5,
      status: "active",
      subscribers: 1247,
      openRate: "48.2%"
    },
    {
      id: 2,
      name: "Abandoned Cart Recovery",
      trigger: "Cart Abandonment",
      emails: 3,
      status: "active",
      subscribers: 892,
      openRate: "34.7%"
    },
    {
      id: 3,
      name: "Re-engagement Campaign",
      trigger: "Inactive 30 days",
      emails: 2,
      status: "paused",
      subscribers: 2156,
      openRate: "22.1%"
    }
  ]);

  const [subscribers] = useState([
    {
      id: 1,
      email: "john.doe@example.com",
      name: "John Doe",
      status: "subscribed",
      source: "Website",
      joinDate: "2024-01-15",
      tags: ["Customer", "VIP"],
      opens: 23,
      clicks: 8
    },
    {
      id: 2,
      email: "sarah.smith@example.com",
      name: "Sarah Smith",
      status: "subscribed",
      source: "Social Media",
      joinDate: "2024-01-20",
      tags: ["Lead", "Interested"],
      opens: 15,
      clicks: 5
    },
    {
      id: 3,
      email: "mike.johnson@example.com",
      name: "Mike Johnson",
      status: "unsubscribed",
      source: "Referral",
      joinDate: "2024-01-10",
      tags: ["Former Customer"],
      opens: 45,
      clicks: 12
    }
  ]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('email_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setCampaigns(data || []);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [user]);

  const handleCampaignSaved = () => {
    loadCampaigns();
    setCampaignFormOpen(false);
    setEditingCampaign(null);
    toast({
      title: "Success",
      description: "Campaign saved successfully"
    });
  };

  const duplicateCampaign = (campaign) => {
    const duplicated = {
      ...campaign,
      name: `${campaign.name} (Copy)`,
      status: 'draft'
    };
    setEditingCampaign(duplicated);
    setCampaignFormOpen(true);
  };

  const deleteCampaign = async (campaignId) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);
      
      if (error) throw error;
      
      loadCampaigns();
      toast({
        title: "Success",
        description: "Campaign deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground">Create, manage, and track your email campaigns</p>
        </div>
        <Dialog open={campaignFormOpen} onOpenChange={setCampaignFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingCampaign(null);
              setCampaignFormOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </DialogTitle>
              <DialogDescription>
                {editingCampaign ? 'Update your email campaign' : 'Create a new email marketing campaign'}
              </DialogDescription>
            </DialogHeader>
            <EmailCampaignForm 
              campaign={editingCampaign}
              onSubmit={handleCampaignSaved}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Total Sent</span>
            </div>
            <div className="text-2xl font-bold">47,329</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Open Rate</span>
            </div>
            <div className="text-2xl font-bold">42.8%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MousePointer className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Click Rate</span>
            </div>
            <div className="text-2xl font-bold">8.4%</div>
            <p className="text-xs text-muted-foreground">+0.8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Subscribers</span>
            </div>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">+387 new this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Active Campaigns</CardTitle>
                  <CardDescription>Manage your email marketing campaigns</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="Search campaigns..." className="pl-10 w-72" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaignStats.map((campaign) => (
                  <div key={campaign.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Last sent: {campaign.lastSent}</span>
                          <span>Next send: {campaign.nextSend}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          campaign.status === 'active' ? 'default' :
                          campaign.status === 'scheduled' ? 'secondary' :
                          'outline'
                        }>
                          {campaign.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteCampaign(campaign.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Sent:</span>
                        <div className="font-semibold">{campaign.sent.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opens:</span>
                        <div className="font-semibold">{campaign.opens.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clicks:</span>
                        <div className="font-semibold">{campaign.clicks.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Open Rate:</span>
                        <div className="font-semibold text-green-600">{campaign.openRate}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Click Rate:</span>
                        <div className="font-semibold text-blue-600">{campaign.clickRate}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Choose from professionally designed templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={template.thumbnail} 
                          alt={template.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                      <div className="flex justify-between items-center mb-3">
                        <Badge variant="outline">{template.category}</Badge>
                        <div className="flex space-x-2 text-xs text-muted-foreground">
                          <span>Opens: {template.opens}</span>
                          <span>Clicks: {template.clicks}</span>
                        </div>
                      </div>
                      <Button className="w-full" size="sm">Use Template</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Automations</CardTitle>
              <CardDescription>Set up automated email sequences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automations.map((automation) => (
                  <div key={automation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{automation.name}</h3>
                        <p className="text-sm text-muted-foreground">Trigger: {automation.trigger}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                          {automation.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          {automation.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Emails:</span>
                        <div className="font-semibold">{automation.emails}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Subscribers:</span>
                        <div className="font-semibold">{automation.subscribers.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Open Rate:</span>
                        <div className="font-semibold text-green-600">{automation.openRate}</div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" className="w-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscriber Management</CardTitle>
              <CardDescription>Manage your email subscribers and segments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{subscriber.name}</h3>
                        <p className="text-sm text-muted-foreground">{subscriber.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={subscriber.status === 'subscribed' ? 'default' : 'secondary'}>
                          {subscriber.status}
                        </Badge>
                        <div className="flex space-x-1">
                          {subscriber.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Source:</span>
                        <div className="font-semibold">{subscriber.source}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Joined:</span>
                        <div className="font-semibold">{subscriber.joinDate}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opens:</span>
                        <div className="font-semibold">{subscriber.opens}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clicks:</span>
                        <div className="font-semibold">{subscriber.clicks}</div>
                      </div>
                      <div>
                        <Button size="sm" variant="outline" className="w-full">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Email performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="w-16 h-16 mb-4" />
                  <div className="text-center">
                    <p>Analytics chart would go here</p>
                    <p className="text-sm">Showing open rates, click rates, and engagement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Campaigns</CardTitle>
                <CardDescription>Your best campaigns this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaignStats.slice(0, 3).map((campaign, index) => (
                    <div key={campaign.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">Open rate: {campaign.openRate}</p>
                      </div>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailMarketing;