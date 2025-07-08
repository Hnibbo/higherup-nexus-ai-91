import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ContactForm from "@/components/ContactForm";
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
  Download,
  Trash2,
  Edit
} from "lucide-react";

const CRM = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedContact, setSelectedContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("contacts");
  const [contacts, setContacts] = useState([]);
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContacts: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0
  });

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

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setContacts(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const hot = data?.filter(c => c.lead_score >= 80).length || 0;
      const warm = data?.filter(c => c.lead_score >= 50 && c.lead_score < 80).length || 0;
      const cold = data?.filter(c => c.lead_score < 50).length || 0;
      
      setStats({
        totalContacts: total,
        hotLeads: hot,
        warmLeads: warm,
        coldLeads: cold
      });
    } catch (error: any) {
      toast({
        title: "Error fetching contacts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: "Contact deleted",
        description: "Contact has been successfully deleted.",
      });
      
      fetchContacts();
      setSelectedContact(null);
    } catch (error: any) {
      toast({
        title: "Error deleting contact",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (leadScore: number) => {
    if (leadScore >= 80) return "bg-red-500";
    if (leadScore >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getStatusText = (leadScore: number) => {
    if (leadScore >= 80) return "Hot";
    if (leadScore >= 50) return "Warm";
    return "Cold";
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <Button onClick={() => setContactFormOpen(true)}>
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
                  <p className="text-2xl font-bold">{stats.totalContacts}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Hot Leads</p>
                  <p className="text-2xl font-bold">{stats.hotLeads}</p>
                  <p className="text-xs text-red-600">Score ≥ 80</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Warm Leads</p>
                  <p className="text-2xl font-bold">{stats.warmLeads}</p>
                  <p className="text-xs text-yellow-600">Score 50-79</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cold Leads</p>
                  <p className="text-2xl font-bold">{stats.coldLeads}</p>
                  <p className="text-xs text-blue-600">Score &lt; 50</p>
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
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-muted-foreground mt-2">Loading contacts...</p>
                        </div>
                      ) : filteredContacts.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-muted-foreground">
                            {searchTerm ? "No contacts found matching your search" : "No contacts yet. Add your first contact!"}
                          </p>
                        </div>
                      ) : (
                        filteredContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedContact(contact)}
                          >
                            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold">
                                {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium">{contact.name}</h4>
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(contact.lead_score)}`} />
                                <Badge variant="outline" className="text-xs">
                                  {getStatusText(contact.lead_score)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{contact.email}</p>
                              <p className="text-sm text-muted-foreground">{contact.company}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">Score: {contact.lead_score}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(contact.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingContact(contact);
                                  setContactFormOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteContact(contact.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
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
                            <span className="text-lg font-semibold">
                              {selectedContact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <h3 className="font-semibold">{selectedContact.name}</h3>
                          <p className="text-sm text-muted-foreground">{selectedContact.company}</p>
                          <div className="flex items-center justify-center space-x-2 mt-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedContact.lead_score)}`} />
                            <Badge variant="outline">
                              {getStatusText(selectedContact.lead_score)} Lead
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {selectedContact.email && (
                            <div className="flex items-center space-x-3">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{selectedContact.email}</span>
                            </div>
                          )}
                          {selectedContact.phone && (
                            <div className="flex items-center space-x-3">
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{selectedContact.phone}</span>
                            </div>
                          )}
                          {selectedContact.company && (
                            <div className="flex items-center space-x-3">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{selectedContact.company}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Lead Score</Label>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Score: {selectedContact.lead_score}/100</span>
                              <span>{getStatusText(selectedContact.lead_score)}</span>
                            </div>
                            <Progress value={selectedContact.lead_score} className="h-2" />
                          </div>
                        </div>

                        {selectedContact.tags && selectedContact.tags.length > 0 && (
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
                        )}

                        {selectedContact.notes && (
                          <div>
                            <Label className="text-sm font-medium">Notes</Label>
                            <p className="text-sm text-muted-foreground mt-1">{selectedContact.notes}</p>
                          </div>
                        )}

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