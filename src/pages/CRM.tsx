import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  Calendar,
  MoreVertical,
  Star,
  Tag,
  Building,
  MapPin,
  DollarSign,
  TrendingUp,
  Activity,
  Zap,
  Import,
  Download
} from "lucide-react";

const CRM = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");

  const contacts = [
    {
      id: 1,
      name: "John Smith",
      email: "john@company.com",
      phone: "+1 (555) 123-4567",
      company: "Tech Solutions Inc",
      status: "hot",
      value: "$15,000",
      lastContact: "2 hours ago",
      tags: ["VIP", "Enterprise"],
      avatar: "JS"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@startup.co",
      phone: "+1 (555) 987-6543",
      company: "Innovation Startup",
      status: "warm",
      value: "$8,500",
      lastContact: "1 day ago",
      tags: ["Startup", "Tech"],
      avatar: "SJ"
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "mike@enterprise.com",
      phone: "+1 (555) 456-7890",
      company: "Enterprise Corp",
      status: "cold",
      value: "$25,000",
      lastContact: "1 week ago",
      tags: ["Enterprise", "Fortune 500"],
      avatar: "MC"
    }
  ];

  const deals = [
    {
      id: 1,
      title: "Enterprise Software License",
      contact: "John Smith",
      value: "$15,000",
      stage: "Proposal",
      probability: 75,
      closeDate: "2024-02-15"
    },
    {
      id: 2,
      title: "Marketing Automation Setup",
      contact: "Sarah Johnson",
      value: "$8,500",
      stage: "Negotiation",
      probability: 60,
      closeDate: "2024-02-20"
    },
    {
      id: 3,
      title: "Custom Integration Project",
      contact: "Michael Chen",
      value: "$25,000",
      stage: "Discovery",
      probability: 30,
      closeDate: "2024-03-01"
    }
  ];

  const activities = [
    {
      id: 1,
      type: "email",
      description: "Sent proposal to John Smith",
      timestamp: "2 hours ago",
      contact: "John Smith"
    },
    {
      id: 2,
      type: "call",
      description: "Called Sarah Johnson - discussed pricing",
      timestamp: "1 day ago",
      contact: "Sarah Johnson"
    },
    {
      id: 3,
      type: "meeting",
      description: "Discovery meeting with Michael Chen",
      timestamp: "3 days ago",
      contact: "Michael Chen"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "hot": return "bg-red-500";
      case "warm": return "bg-yellow-500";
      case "cold": return "bg-blue-500";
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
            <span className="text-lg font-semibold">CRM</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost">
              <Import className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Customer Relationship Management</h1>
          <p className="text-muted-foreground">
            Manage your contacts, deals, and sales pipeline with AI-powered insights
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-green-600">+12% this month</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-xs text-green-600">+8% this month</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pipeline Value</p>
                  <p className="text-2xl font-bold">$284K</p>
                  <p className="text-xs text-green-600">+23% this month</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">24.5%</p>
                  <p className="text-xs text-green-600">+3.2% this month</p>
                </div>
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="deals">Deals</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    className="pl-10 w-72"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
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
              {/* Contacts List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>Manage your customer database</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold">{contact.avatar}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium">{contact.name}</h4>
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(contact.status)}`} />
                            </div>
                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                            <p className="text-sm text-muted-foreground">{contact.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">{contact.value}</p>
                            <p className="text-xs text-muted-foreground">{contact.lastContact}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Details */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                    <CardDescription>
                      {selectedContact ? selectedContact.name : "Select a contact to view details"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedContact ? (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-lg font-semibold">{selectedContact.avatar}</span>
                          </div>
                          <h3 className="font-semibold">{selectedContact.name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{selectedContact.email}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{selectedContact.phone}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{selectedContact.company}</span>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedContact.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Button className="w-full" size="sm">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </Button>
                          <Button variant="outline" className="w-full" size="sm">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                          <Button variant="outline" className="w-full" size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Meeting
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Select a contact to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deals">
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>Track your deals through the sales process</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deals.map((deal) => (
                    <div key={deal.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{deal.title}</h4>
                          <p className="text-sm text-muted-foreground">{deal.contact}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{deal.value}</p>
                          <Badge variant={deal.stage === "Proposal" ? "default" : "secondary"}>
                            {deal.stage}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Probability: {deal.probability}%</span>
                          <span>Close Date: {deal.closeDate}</span>
                        </div>
                        <Progress value={deal.probability} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>Track all interactions with your contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        {activity.type === "email" && <Mail className="w-4 h-4 text-primary" />}
                        {activity.type === "call" && <Phone className="w-4 h-4 text-primary" />}
                        {activity.type === "meeting" && <Calendar className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">{activity.contact}</span>
                          <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Performance</CardTitle>
                  <CardDescription>Track your sales metrics over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                    <p className="text-muted-foreground">Sales analytics chart</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Lead Sources</CardTitle>
                  <CardDescription>Where your leads are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded flex items-center justify-center">
                    <p className="text-muted-foreground">Lead sources chart</p>
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

export default CRM;