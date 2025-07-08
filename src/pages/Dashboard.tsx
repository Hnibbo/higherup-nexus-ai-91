import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  Mail, 
  Calendar, 
  Bot, 
  Zap,
  BarChart3,
  Target,
  DollarSign,
  Activity,
  MessageSquare,
  Phone,
  Video,
  Settings,
  Plus
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    {
      title: "Total Contacts",
      value: "12,847",
      change: "+12.5%",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Campaigns",
      value: "23",
      change: "+4",
      icon: Target,
      color: "text-green-600"
    },
    {
      title: "Revenue This Month",
      value: "$47,832",
      change: "+23.1%",
      icon: DollarSign,
      color: "text-purple-600"
    },
    {
      title: "Conversion Rate",
      value: "8.2%",
      change: "+1.3%",
      icon: TrendingUp,
      color: "text-orange-600"
    }
  ];

  const recentActivities = [
    {
      type: "email",
      message: "Email campaign 'Summer Sale' sent to 1,234 contacts",
      time: "2 hours ago",
      status: "success"
    },
    {
      type: "funnel",
      message: "New lead captured through 'Product Demo' funnel",
      time: "4 hours ago",
      status: "info"
    },
    {
      type: "automation",
      message: "AI Assistant created follow-up sequence",
      time: "6 hours ago",
      status: "success"
    },
    {
      type: "video",
      message: "Marketing video generated for 'Black Friday' campaign",
      time: "1 day ago",
      status: "success"
    }
  ];

  const quickActions = [
    { title: "Create Campaign", icon: Mail, description: "Launch email or SMS campaign" },
    { title: "Build Funnel", icon: Target, description: "Design conversion funnel" },
    { title: "Generate Video", icon: Video, description: "AI-powered video creation" },
    { title: "Schedule Meeting", icon: Calendar, description: "Book appointments" },
    { title: "Chat with AI", icon: Bot, description: "Get AI assistance" },
    { title: "View Analytics", icon: BarChart3, description: "Check performance metrics" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HigherUp.ai</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">JD</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, John!</h1>
            <p className="text-muted-foreground">Here's what's happening with your business today.</p>
          </div>
          <Button className="group">
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            Quick Start
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.change} from last month</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="funnels">Funnels</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-primary" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common tasks to get you started quickly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start group hover:border-primary"
                      >
                        <div className="flex items-center w-full mb-2">
                          <action.icon className="w-5 h-5 mr-2 text-primary group-hover:scale-110 transition-transform" />
                          <span className="font-medium">{action.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground text-left">
                          {action.description}
                        </span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Assistant */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-primary" />
                    AI Assistant
                  </CardTitle>
                  <CardDescription>
                    Your intelligent business co-pilot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="font-medium">AI Suggestion</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      I notice your email open rates dropped 2%. Would you like me to optimize your subject lines?
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm">Accept</Button>
                      <Button size="sm" variant="outline">Dismiss</Button>
                    </div>
                  </div>
                  <Button className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with AI
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest updates from your campaigns and automations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-500' : 
                        activity.status === 'info' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Manage your email, SMS, and multi-channel campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Mail className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">Summer Sale Campaign</h4>
                        <p className="text-sm text-muted-foreground">Email • 1,234 recipients</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">72% Open Rate</p>
                      <Progress value={72} className="w-20 mt-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Phone className="w-8 h-8 text-green-600" />
                      <div>
                        <h4 className="font-medium">Product Launch SMS</h4>
                        <p className="text-sm text-muted-foreground">SMS • 856 recipients</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">89% Delivery</p>
                      <Progress value={89} className="w-20 mt-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funnels">
            <Card>
              <CardHeader>
                <CardTitle>Sales Funnels</CardTitle>
                <CardDescription>Track performance of your conversion funnels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Product Demo Funnel</h4>
                      <Badge>Active</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">1,247</p>
                        <p className="text-xs text-muted-foreground">Visitors</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">234</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">67</p>
                        <p className="text-xs text-muted-foreground">Customers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">5.4%</p>
                        <p className="text-xs text-muted-foreground">Conversion</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Detailed insights into your marketing performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Revenue Trend</h4>
                    <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded flex items-end justify-center">
                      <BarChart3 className="w-8 h-8 text-primary mb-4" />
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Conversion Funnel</h4>
                    <div className="h-32 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded flex items-end justify-center">
                      <Target className="w-8 h-8 text-green-600 mb-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;