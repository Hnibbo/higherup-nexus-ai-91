import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Send, 
  Users, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Calendar,
  BarChart3,
  Target,
  Smartphone,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SMSMarketing = () => {
  const { toast } = useToast();
  
  const [campaigns, setCampaigns] = useState([
    { 
      id: 1, 
      name: "Welcome Series", 
      status: "Active", 
      sent: 1250, 
      delivered: 1248, 
      responses: 89, 
      clickRate: 7.1,
      type: "Automated"
    },
    { 
      id: 2, 
      name: "Flash Sale Alert", 
      status: "Completed", 
      sent: 2500, 
      delivered: 2487, 
      responses: 234, 
      clickRate: 9.4,
      type: "Broadcast"
    },
    { 
      id: 3, 
      name: "Appointment Reminders", 
      status: "Active", 
      sent: 567, 
      delivered: 565, 
      responses: 12, 
      clickRate: 2.1,
      type: "Automated"
    },
  ]);

  const [contacts, setContacts] = useState([
    { id: 1, name: "John Smith", phone: "+1234567890", status: "Subscribed", tags: ["VIP", "Customer"] },
    { id: 2, name: "Sarah Johnson", phone: "+1234567891", status: "Subscribed", tags: ["Lead"] },
    { id: 3, name: "Mike Wilson", phone: "+1234567892", status: "Unsubscribed", tags: ["Former Customer"] },
  ]);

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    message: "",
    type: "broadcast",
    scheduledTime: ""
  });

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.message) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    const campaign = {
      id: campaigns.length + 1,
      name: newCampaign.name,
      status: "Draft",
      sent: 0,
      delivered: 0,
      responses: 0,
      clickRate: 0,
      type: newCampaign.type === "broadcast" ? "Broadcast" : "Automated"
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ name: "", message: "", type: "broadcast", scheduledTime: "" });
    
    toast({
      title: "Success",
      description: "SMS campaign created successfully"
    });
  };

  const handleSendTestMessage = () => {
    toast({
      title: "Test Message Sent",
      description: "Test SMS has been sent to your phone number"
    });
  };

  const stats = [
    { label: "Total Contacts", value: "12,847", icon: Users, change: "+23%" },
    { label: "Messages Sent", value: "4,317", icon: MessageSquare, change: "+12%" },
    { label: "Delivery Rate", value: "99.7%", icon: Target, change: "+0.3%" },
    { label: "Response Rate", value: "8.2%", icon: TrendingUp, change: "+18%" }
  ];

  const messageTemplates = [
    "🎉 Flash Sale! Get 50% off everything today only. Use code FLASH50. Shop now: [link]",
    "Hi [name], your appointment is confirmed for [date] at [time]. Reply CONFIRM to confirm.",
    "Welcome to [company]! Thanks for joining us. Get 20% off your first order with code WELCOME20",
    "⏰ Don't forget! Your cart is waiting. Complete your purchase now and save 15%: [link]",
    "🚀 New product alert! Check out our latest [product]. Limited time offer: [link]"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">SMS Marketing</h1>
            <p className="text-muted-foreground">Reach customers instantly with powerful SMS campaigns</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSendTestMessage}>
              <Smartphone className="w-4 h-4 mr-2" />
              Send Test
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create SMS Campaign</DialogTitle>
                  <DialogDescription>Set up a new SMS marketing campaign</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Enter campaign name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={newCampaign.message}
                      onChange={(e) => setNewCampaign({ ...newCampaign, message: e.target.value })}
                      placeholder="Type your SMS message here..."
                      className="h-24"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {newCampaign.message.length}/160 characters
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="type">Campaign Type</Label>
                    <Select 
                      value={newCampaign.type} 
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="broadcast">Broadcast (Send Now)</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="automated">Automated Sequence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newCampaign.type === "scheduled" && (
                    <div>
                      <Label htmlFor="scheduledTime">Schedule Time</Label>
                      <Input
                        id="scheduledTime"
                        type="datetime-local"
                        value={newCampaign.scheduledTime}
                        onChange={(e) => setNewCampaign({ ...newCampaign, scheduledTime: e.target.value })}
                      />
                    </div>
                  )}
                  <Button onClick={handleCreateCampaign} className="w-full">
                    Create Campaign
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-600">{stat.change}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SMS Campaigns</CardTitle>
                <CardDescription>Manage your SMS marketing campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <Badge variant={campaign.status === 'Active' ? 'default' : campaign.status === 'Completed' ? 'secondary' : 'outline'}>
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline">{campaign.type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sent:</span>
                          <span className="ml-2 font-medium">{campaign.sent.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Delivered:</span>
                          <span className="ml-2 font-medium">{campaign.delivered.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Responses:</span>
                          <span className="ml-2 font-medium">{campaign.responses}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Click Rate:</span>
                          <span className="ml-2 font-medium">{campaign.clickRate}%</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Delivery Rate</span>
                          <span>{((campaign.delivered / campaign.sent) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(campaign.delivered / campaign.sent) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Contact List</CardTitle>
                    <CardDescription>Manage your SMS subscribers</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Contact
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{contact.name}</h3>
                          <Badge variant={contact.status === 'Subscribed' ? 'default' : 'secondary'}>
                            {contact.status}
                          </Badge>
                          <div className="flex gap-1">
                            {contact.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{contact.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Message Templates</CardTitle>
                    <CardDescription>Pre-built SMS templates for quick campaigns</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {messageTemplates.map((template, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <p className="text-sm mb-3">{template}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {template.length}/160 characters
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Zap className="w-4 h-4 mr-1" />
                            Use Template
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Campaign performance chart</p>
                      <p className="text-sm">Real-time analytics coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Best Performing Messages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {campaigns.sort((a, b) => b.clickRate - a.clickRate).slice(0, 3).map((campaign, index) => (
                      <div key={campaign.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono">#{index + 1}</span>
                          <span className="font-medium">{campaign.name}</span>
                        </div>
                        <span className="text-sm text-green-600">{campaign.clickRate}% CTR</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>SMS Credits</CardTitle>
                <CardDescription>Monitor your SMS usage and credits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">2,847</div>
                    <div className="text-sm text-muted-foreground">Credits Remaining</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">4,317</div>
                    <div className="text-sm text-muted-foreground">Messages Sent This Month</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">$0.05</div>
                    <div className="text-sm text-muted-foreground">Cost Per Message</div>
                  </div>
                </div>
                <div className="mt-6">
                  <Button className="w-full">Buy More Credits</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SMSMarketing;