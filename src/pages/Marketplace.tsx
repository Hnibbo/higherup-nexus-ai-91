import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import marketplacePlugin from "@/assets/marketplace-plugin.jpg";
import marketplacePlugin2 from "@/assets/marketplace-plugin-2.jpg";
import marketplaceIntegration from "@/assets/marketplace-integration.jpg";
import marketplaceTemplate from "@/assets/marketplace-template.jpg";
import marketplaceAnalytics from "@/assets/marketplace-analytics.jpg";
import funnelCourse from "@/assets/funnel-course.jpg";
import funnelLeadMagnet from "@/assets/funnel-lead-magnet.jpg";
import funnelProductLaunch from "@/assets/funnel-product-launch.jpg";
import { 
  Store, 
  Download, 
  Star, 
  Search, 
  Filter,
  Grid3X3,
  List,
  Zap,
  Puzzle,
  Palette,
  BarChart3,
  Shield,
  Smartphone,
  Globe,
  Code,
  Video,
  Mail,
  Bot,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Heart,
  Eye,
  ShoppingCart,
  Plus
} from "lucide-react";

const Marketplace = () => {
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Items", icon: Grid3X3, count: 347 },
    { id: "templates", name: "Templates", icon: Palette, count: 128 },
    { id: "plugins", name: "Plugins", icon: Puzzle, count: 89 },
    { id: "integrations", name: "Integrations", icon: Globe, count: 67 },
    { id: "themes", name: "Themes", icon: Smartphone, count: 45 },
    { id: "analytics", name: "Analytics", icon: BarChart3, count: 23 },
    { id: "ai-tools", name: "AI Tools", icon: Bot, count: 34 }
  ];

  const plugins = [
    {
      id: 1,
      name: "Advanced Analytics Pro",
      description: "Deep insights and custom reporting for your funnels",
      price: 29,
      category: "Analytics",
      rating: 4.8,
      reviews: 156,
      image: marketplaceAnalytics,
      developer: "AnalyticsPro Inc.",
      installs: "5k+",
      features: ["Custom Reports", "Real-time Data", "API Access", "White Label"]
    },
    {
      id: 2,
      name: "Social Media Automation",
      description: "Auto-post to all social platforms with AI optimization",
      price: 39,
      category: "Automation",
      rating: 4.9,
      reviews: 203,
      image: marketplacePlugin,
      developer: "SocialBot",
      installs: "8k+",
      features: ["Multi-Platform", "AI Content", "Scheduling", "Analytics"]
    },
    {
      id: 3,
      name: "Lead Scoring Engine",
      description: "AI-powered lead scoring and qualification system",
      price: 49,
      category: "CRM",
      rating: 4.7,
      reviews: 89,
      image: marketplacePlugin2,
      developer: "LeadTech",
      installs: "3k+",
      features: ["AI Scoring", "Auto Qualification", "CRM Sync", "Reports"]
    },
    {
      id: 4,
      name: "Payment Gateway Pro",
      description: "Accept payments from 50+ countries with advanced fraud protection",
      price: 19,
      category: "Payments",
      rating: 4.6,
      reviews: 324,
      image: marketplaceIntegration,
      developer: "PaySecure",
      installs: "12k+",
      features: ["Global Payments", "Fraud Protection", "Multi-Currency", "Recurring"]
    },
    {
      id: 5,
      name: "Email Deliverability Booster",
      description: "Improve email deliverability with advanced optimization",
      price: 35,
      category: "Email",
      rating: 4.8,
      reviews: 167,
      image: marketplaceTemplate,
      developer: "MailBoost",
      installs: "6k+",
      features: ["Deliverability Score", "Spam Testing", "Domain Warming", "Analytics"]
    },
    {
      id: 6,
      name: "Video Hosting & Analytics",
      description: "Professional video hosting with detailed viewer analytics",
      price: 25,
      category: "Video",
      rating: 4.5,
      reviews: 98,
      image: funnelCourse,
      developer: "VideoHost Pro",
      installs: "4k+",
      features: ["HD Streaming", "Analytics", "Custom Player", "Embedding"]
    },
    {
      id: 7,
      name: "Webinar Integration Suite",
      description: "Connect with all major webinar platforms seamlessly",
      price: 45,
      category: "Integration",
      rating: 4.7,
      reviews: 134,
      image: funnelLeadMagnet,
      developer: "WebinarLink",
      installs: "7k+",
      features: ["Multi-Platform", "Auto Registration", "Follow-up", "Analytics"]
    },
    {
      id: 8,
      name: "A/B Testing Advanced",
      description: "Comprehensive A/B testing with statistical significance",
      price: 55,
      category: "Optimization",
      rating: 4.9,
      reviews: 78,
      image: funnelProductLaunch,
      developer: "TestOptimal",
      installs: "2k+",
      features: ["Statistical Analysis", "Multi-variant", "Auto Winner", "Reports"]
    }
  ];

  const templates = [
    {
      id: 1,
      name: "SaaS Landing Page Pro",
      description: "High-converting landing page template for SaaS products",
      price: 49,
      category: "Landing Pages",
      rating: 4.9,
      reviews: 234,
      image: marketplaceTemplate,
      developer: "Template Pro",
      downloads: "3.2k",
      features: ["Responsive", "A/B Ready", "Analytics", "SEO Optimized"]
    },
    {
      id: 2,
      name: "E-commerce Funnel Bundle",
      description: "Complete funnel templates for online stores",
      price: 89,
      category: "E-commerce",
      rating: 4.8,
      reviews: 187,
      image: funnelProductLaunch,
      developer: "Commerce Templates",
      downloads: "2.8k",
      features: ["5 Templates", "Mobile First", "Payment Ready", "Conversion Optimized"]
    },
    {
      id: 3,
      name: "Lead Magnet Collection",
      description: "20+ proven lead magnet templates",
      price: 39,
      category: "Lead Generation",
      rating: 4.7,
      reviews: 156,
      image: funnelLeadMagnet,
      developer: "Lead Gen Masters",
      downloads: "4.1k",
      features: ["20 Templates", "Editable", "Print Ready", "Multiple Formats"]
    }
  ];

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || plugin.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || selectedCategory === "templates";
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Store className="w-8 h-8 mr-3 text-primary" />
            Marketplace
          </h1>
          <p className="text-muted-foreground">Extend your platform with powerful plugins, templates, and integrations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Heart className="w-4 h-4 mr-2" />
            Wishlist
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Submit Item
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search templates, plugins, integrations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant={viewMode === "grid" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <category.icon className="w-4 h-4 mr-2" />
                    <span className="flex-1 text-left">{category.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Item */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Featured This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <img src={marketplacePlugin} alt="Featured" className="w-full aspect-video object-cover rounded-lg" />
                <h3 className="font-semibold">AI Content Generator Pro</h3>
                <p className="text-sm text-muted-foreground">Create unlimited content with advanced AI</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">$79</span>
                  <Button size="sm">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="plugins" className="space-y-6">
            <TabsList>
              <TabsTrigger value="plugins">Plugins</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="my-items">My Items</TabsTrigger>
            </TabsList>

            <TabsContent value="plugins">
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredPlugins.map((plugin) => (
                  <Card key={plugin.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={plugin.image} 
                          alt={plugin.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">{plugin.name}</h3>
                          <Badge variant="outline">{plugin.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{plugin.description}</p>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>{plugin.rating}</span>
                          </div>
                          <span className="text-muted-foreground">({plugin.reviews} reviews)</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{plugin.installs} installs</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {plugin.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-2xl font-bold">${plugin.price}</span>
                            <span className="text-sm text-muted-foreground">/month</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm">Install</Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{plugin.name}</DialogTitle>
                                  <DialogDescription>
                                    Install this plugin to extend your platform's functionality
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <img src={plugin.image} alt={plugin.name} className="w-full aspect-video object-cover rounded-lg" />
                                  <p>{plugin.description}</p>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">Features</h4>
                                      <ul className="space-y-1">
                                        {plugin.features.map((feature, index) => (
                                          <li key={index} className="flex items-center text-sm">
                                            <Zap className="w-3 h-3 mr-2 text-green-500" />
                                            {feature}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">Details</h4>
                                      <div className="space-y-2 text-sm">
                                        <div>Developer: {plugin.developer}</div>
                                        <div>Rating: {plugin.rating}/5 ({plugin.reviews} reviews)</div>
                                        <div>Installs: {plugin.installs}</div>
                                        <div>Price: ${plugin.price}/month</div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline">Learn More</Button>
                                    <Button>Install Now - ${plugin.price}/month</Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={template.image} 
                          alt={template.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        
                        <div className="flex items-center space-x-2 text-sm">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span>{template.rating}</span>
                          </div>
                          <span className="text-muted-foreground">({template.reviews} reviews)</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{template.downloads} downloads</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.features.map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-2xl font-bold">${template.price}</span>
                            <span className="text-sm text-muted-foreground"> one-time</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Buy
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="integrations">
              <div className="text-center py-12">
                <Globe className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Integrations Coming Soon</h3>
                <p className="text-muted-foreground">Connect with your favorite tools and services</p>
              </div>
            </TabsContent>

            <TabsContent value="my-items">
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Items Purchased Yet</h3>
                <p className="text-muted-foreground mb-4">Browse and install plugins and templates to get started</p>
                <Button>Browse Marketplace</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;