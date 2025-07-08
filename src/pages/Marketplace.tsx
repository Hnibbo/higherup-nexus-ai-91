import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const featuredItems = [
    {
      id: 1,
      name: "Ultimate Sales Funnel Pack",
      developer: "FunnelMaster Pro",
      category: "Templates",
      price: "$97",
      originalPrice: "$197",
      rating: 4.9,
      reviews: 1247,
      downloads: 15678,
      image: "/api/placeholder/300/200",
      description: "Complete collection of high-converting sales funnels",
      featured: true,
      bestseller: true,
      tags: ["Sales", "E-commerce", "SaaS"]
    },
    {
      id: 2,
      name: "Advanced Analytics Dashboard",
      developer: "DataViz Solutions",
      category: "Plugins",
      price: "$47",
      originalPrice: null,
      rating: 4.8,
      reviews: 892,
      downloads: 8934,
      image: "/api/placeholder/300/200",
      description: "Real-time analytics with custom reporting",
      featured: true,
      bestseller: false,
      tags: ["Analytics", "Reporting", "Dashboard"]
    },
    {
      id: 3,
      name: "AI Content Generator Pro",
      developer: "ContentAI Inc",
      category: "AI Tools",
      price: "$67",
      originalPrice: "$97",
      rating: 4.7,
      reviews: 567,
      downloads: 12456,
      image: "/api/placeholder/300/200",
      description: "Generate blog posts, ads, and social content with AI",
      featured: true,
      bestseller: true,
      tags: ["AI", "Content", "Marketing"]
    }
  ];

  const marketplaceItems = [
    {
      id: 4,
      name: "E-commerce Store Template",
      developer: "ShopDesign Co",
      category: "Templates",
      price: "$37",
      originalPrice: null,
      rating: 4.6,
      reviews: 423,
      downloads: 5678,
      image: "/api/placeholder/300/200",
      description: "Modern e-commerce template with cart functionality",
      featured: false,
      bestseller: false,
      tags: ["E-commerce", "Store", "Shopping"]
    },
    {
      id: 5,
      name: "Social Media Scheduler",
      developer: "SocialTools Ltd",
      category: "Plugins",
      price: "Free",
      originalPrice: null,
      rating: 4.4,
      reviews: 1834,
      downloads: 23456,
      image: "/api/placeholder/300/200",
      description: "Schedule and manage social media posts",
      featured: false,
      bestseller: false,
      tags: ["Social Media", "Scheduling", "Marketing"]
    },
    {
      id: 6,
      name: "Payment Gateway Integration",
      developer: "PaymentPro",
      category: "Integrations",
      price: "$29",
      originalPrice: "$49",
      rating: 4.8,
      reviews: 756,
      downloads: 9876,
      image: "/api/placeholder/300/200",
      description: "Integrate multiple payment processors",
      featured: false,
      bestseller: true,
      tags: ["Payments", "Integration", "E-commerce"]
    },
    {
      id: 7,
      name: "Modern Dashboard Theme",
      developer: "ThemeForge",
      category: "Themes",
      price: "$19",
      originalPrice: null,
      rating: 4.5,
      reviews: 234,
      downloads: 3456,
      image: "/api/placeholder/300/200",
      description: "Clean and modern dashboard theme",
      featured: false,
      bestseller: false,
      tags: ["Theme", "Dashboard", "UI"]
    },
    {
      id: 8,
      name: "Lead Scoring Algorithm",
      developer: "LeadGen AI",
      category: "AI Tools",
      price: "$87",
      originalPrice: "$127",
      rating: 4.9,
      reviews: 345,
      downloads: 2345,
      image: "/api/placeholder/300/200",
      description: "AI-powered lead scoring and qualification",
      featured: false,
      bestseller: false,
      tags: ["AI", "Lead Scoring", "CRM"]
    }
  ];

  const allItems = [...featuredItems, ...marketplaceItems];

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || 
                           item.category.toLowerCase().replace(" ", "-") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const developerStats = [
    {
      name: "Total Revenue",
      value: "$2.4M",
      change: "+23.5%",
      icon: TrendingUp
    },
    {
      name: "Active Developers",
      value: "1,247",
      change: "+12.3%",
      icon: Users
    },
    {
      name: "Total Downloads",
      value: "89.2K",
      change: "+18.7%",
      icon: Download
    },
    {
      name: "Avg Rating",
      value: "4.7/5",
      change: "+0.2",
      icon: Star
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Marketplace</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost">
              <Store className="w-4 h-4 mr-2" />
              Sell on Marketplace
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Submit Item
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HigherUp Marketplace</h1>
          <p className="text-muted-foreground">
            Discover templates, plugins, and tools to supercharge your platform
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {developerStats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.change} this month</p>
                  </div>
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="bestsellers">Bestsellers</TabsTrigger>
            <TabsTrigger value="developer">Developer Hub</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates, plugins, integrations..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Categories Sidebar */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <category.icon className="w-4 h-4 mr-3" />
                        <span className="flex-1 text-left">{category.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {category.count}
                        </Badge>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Items Grid */}
              <div className="lg:col-span-3">
                <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-0">
                        <div className="relative">
                          <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                            <div className="text-center">
                              {item.category === "Templates" && <Palette className="w-12 h-12 text-primary mx-auto mb-2" />}
                              {item.category === "Plugins" && <Puzzle className="w-12 h-12 text-primary mx-auto mb-2" />}
                              {item.category === "Integrations" && <Globe className="w-12 h-12 text-primary mx-auto mb-2" />}
                              {item.category === "Themes" && <Smartphone className="w-12 h-12 text-primary mx-auto mb-2" />}
                              {item.category === "AI Tools" && <Bot className="w-12 h-12 text-primary mx-auto mb-2" />}
                              {item.category === "Analytics" && <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />}
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                            </div>
                          </div>
                          <div className="absolute top-2 left-2">
                            {item.featured && (
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                Featured
                              </Badge>
                            )}
                          </div>
                          <div className="absolute top-2 right-2">
                            {item.bestseller && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                                Bestseller
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold line-clamp-2">{item.name}</h3>
                            <Button variant="ghost" size="sm">
                              <Heart className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.developer}</p>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                          
                          <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span>{item.rating}</span>
                              <span>({item.reviews})</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3" />
                              <span>{item.downloads.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg font-bold text-primary">{item.price}</span>
                              {item.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  {item.originalPrice}
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-3 h-3 mr-1" />
                                Preview
                              </Button>
                              <Button size="sm">
                                {item.price === "Free" ? "Install" : "Buy Now"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="featured">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                      <div className="text-center">
                        <Star className="w-16 h-16 text-primary mx-auto mb-2" />
                        <p className="text-lg font-semibold">Featured Item</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">{item.price}</span>
                        <Button>Get Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bestsellers">
            <div className="space-y-4">
              {allItems.filter(item => item.bestseller).map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                        <span className="text-lg font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{item.name}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{item.rating}</span>
                          </div>
                          <span>{item.downloads.toLocaleString()} downloads</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{item.price}</p>
                        <Button className="mt-2">Buy Now</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="developer">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Become a Developer</CardTitle>
                  <CardDescription>
                    Start selling your templates, plugins, and tools on the HigherUp Marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold">60% Revenue</p>
                      <p className="text-xs text-muted-foreground">You keep 60% of sales</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="font-semibold">Global Reach</p>
                      <p className="text-xs text-muted-foreground">Reach 100K+ users</p>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Start Selling
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Developer Resources</CardTitle>
                  <CardDescription>
                    Everything you need to build and sell on our platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="w-4 h-4 mr-3" />
                    API Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="w-4 h-4 mr-3" />
                    Video Tutorials
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-3" />
                    Developer Community
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-3" />
                    Support Center
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketplace;