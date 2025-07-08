import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EmailCampaignForm from "@/components/EmailCampaignForm";
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

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching campaigns",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign deleted",
        description: "Email campaign has been successfully deleted.",
      });
      
      fetchCampaigns();
      setSelectedCampaign(null);
    } catch (error: any) {
      toast({
        title: "Error deleting campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          total_sent: Math.floor(Math.random() * 5000) + 1000, // Simulate sent count
        })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Campaign sent!",
        description: "Your email campaign has been successfully sent.",
      });
      
      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "Error sending campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const templates = [
    {
      id: 1,
      name: "Product Launch",
      category: "Announcement",
      thumbnail: "/api/placeholder/300/200",
      openRate: "45.2%"
    },
    {
      id: 2,
      name: "Newsletter",
      category: "Content",
      thumbnail: "/api/placeholder/300/200",
      openRate: "38.7%"
    },
    {
      id: 3,
      name: "Flash Sale",
      category: "Promotional",
      thumbnail: "/api/placeholder/300/200",
      openRate: "52.1%"
    },
    {
      id: 4,
      name: "Welcome Series",
      category: "Onboarding",
      thumbnail: "/api/placeholder/300/200",
      openRate: "61.3%"
    }
  ];

  const automations = [
    {
      id: 1,
      name: "Welcome Series",
      trigger: "New Subscriber",
      emails: 5,
      subscribers: 1247,
      status: "active",
      openRate: 58.1,
      revenue: "$12,847"
    },
    {
      id: 2,
      name: "Abandoned Cart Recovery",
      trigger: "Cart Abandonment",
      emails: 3,
      subscribers: 423,
      status: "active",
      openRate: 42.7,
      revenue: "$8,932"
    },
    {
      id: 3,
      name: "Re-engagement Campaign",
      trigger: "Inactive 30 Days",
      emails: 4,
      subscribers: 892,
      status: "paused",
      openRate: 24.3,
      revenue: "$2,156"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "sent": return "bg-green-500";
      case "scheduled": return "bg-blue-500";
      case "active": return "bg-purple-500";
      case "paused": return "bg-yellow-500";
      case "draft": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Email Marketing</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost">
              <Upload className="w-4 h-4 mr-2" />
              Import Contacts
            </Button>
            <Button onClick={() => setCampaignFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Email Marketing Hub</h1>
          <p className="text-muted-foreground">
            Create, send, and optimize email campaigns with AI-powered insights
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Subscribers</p>
                  <p className="text-2xl font-bold">{campaigns.length * 1000 + 847}</p>
                  <p className="text-xs text-green-600">Real-time data</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                  <p className="text-2xl font-bold">42.3%</p>
                  <p className="text-xs text-green-600">+3.1% vs industry</p>
                </div>
                <Eye className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                  <p className="text-2xl font-bold">8.7%</p>
                  <p className="text-xs text-green-600">+1.9% vs industry</p>
                </div>
                <MousePointer className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">$67.2K</p>
                  <p className="text-xs text-green-600">+28.4% this month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="lists">Lists</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search campaigns..." className="pl-10 w-72" />
                </div>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Campaigns List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Campaigns</CardTitle>
                    <CardDescription>Manage and track your email campaigns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-muted-foreground mt-2">Loading campaigns...</p>
                        </div>
                      ) : campaigns.length === 0 ? (
                        <div className="text-center py-8">
                          <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">No campaigns yet. Create your first campaign!</p>
                        </div>
                      ) : (
                        campaigns.map((campaign) => (
                          <div
                            key={campaign.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedCampaign(campaign)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium mb-1">{campaign.name}</h4>
                                <p className="text-sm text-muted-foreground mb-2">{campaign.subject}</p>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${getStatusColor(campaign.status)}`} />
                                  <Badge variant="secondary" className="text-xs">
                                    {campaign.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(campaign.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">
                                  {campaign.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-center text-sm">
                              <div>
                                <p className="font-medium">{campaign.total_sent || 0}</p>
                                <p className="text-xs text-muted-foreground">Sent</p>
                              </div>
                              <div>
                                <p className="font-medium">{campaign.total_opened || 0}</p>
                                <p className="text-xs text-muted-foreground">Opened</p>
                              </div>
                              <div>
                                <p className="font-medium">{campaign.total_clicked || 0}</p>
                                <p className="text-xs text-muted-foreground">Clicked</p>
                              </div>
                              <div className="flex space-x-1">
                                {campaign.status === 'draft' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendCampaign(campaign.id);
                                    }}
                                  >
                                    <Send className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCampaign(campaign);
                                    setCampaignFormOpen(true);
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteCampaign(campaign.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Details */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                    <CardDescription>
                      {selectedCampaign ? selectedCampaign.name : "Select a campaign to view details"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedCampaign ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="font-semibold mb-2">{selectedCampaign.name}</h3>
                          <Badge variant="outline">
                            {selectedCampaign.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Subject Line</Label>
                            <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.subject}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Performance</Label>
                            <div className="mt-2 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Sent: {selectedCampaign.total_sent || 0}</span>
                                <span>Opened: {selectedCampaign.total_opened || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Clicked: {selectedCampaign.total_clicked || 0}</span>
                                <span>Status: {selectedCampaign.status}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Created</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(selectedCampaign.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button className="w-full" size="sm">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Full Report
                          </Button>
                          <Button variant="outline" className="w-full" size="sm">
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate Campaign
                          </Button>
                          <Button variant="outline" className="w-full" size="sm">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit Campaign
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Select a campaign to view details and performance metrics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automation">
            <Card>
              <CardHeader>
                <CardTitle>Email Automation Flows</CardTitle>
                <CardDescription>Automated email sequences triggered by user behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {automations.map((automation) => (
                    <div key={automation.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium mb-1">{automation.name}</h4>
                          <p className="text-sm text-muted-foreground">Trigger: {automation.trigger}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span>{automation.emails} emails</span>
                            <span>{automation.subscribers} subscribers</span>
                            <span>{automation.openRate}% open rate</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{automation.revenue}</p>
                          <Badge variant={automation.status === "active" ? "default" : "secondary"}>
                            {automation.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          {automation.status === "active" ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                          {automation.status === "active" ? "Pause" : "Activate"}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center">
                      <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{template.category}</p>
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-xs">
                        {template.openRate} avg open
                      </Badge>
                      <Button size="sm">Use Template</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lists">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Lists</CardTitle>
                <CardDescription>Manage and segment your email subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">All Subscribers</h4>
                        <p className="text-sm text-muted-foreground">24,847 contacts</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">VIP Customers</h4>
                        <p className="text-sm text-muted-foreground">1,247 contacts</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">New Leads</h4>
                        <p className="text-sm text-muted-foreground">3,421 contacts</p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance Over Time</CardTitle>
                  <CardDescription>Track open rates, click rates, and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                    <p className="text-muted-foreground">Performance analytics chart</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Subscriber Growth</CardTitle>
                  <CardDescription>Track how your email list is growing</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded flex items-center justify-center">
                    <p className="text-muted-foreground">Subscriber growth chart</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmailMarketing;