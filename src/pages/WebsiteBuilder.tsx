import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Layout, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  Palette,
  Type,
  Image as ImageIcon,
  Video,
  Code,
  Settings,
  Upload,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const WebsiteBuilder = () => {
  const { toast } = useToast();
  
  const [websites, setWebsites] = useState([
    { 
      id: 1, 
      name: "Business Landing Page", 
      url: "business-landing", 
      status: "Published", 
      template: "Business Pro",
      lastEdited: "2024-01-15",
      visitors: 1247,
      conversions: 89
    },
    { 
      id: 2, 
      name: "Product Showcase", 
      url: "product-showcase", 
      status: "Draft", 
      template: "E-commerce",
      lastEdited: "2024-01-14",
      visitors: 0,
      conversions: 0
    },
    { 
      id: 3, 
      name: "Personal Portfolio", 
      url: "portfolio", 
      status: "Published", 
      template: "Creative",
      lastEdited: "2024-01-12",
      visitors: 567,
      conversions: 12
    },
  ]);

  const [templates] = useState([
    { id: 1, name: "Business Pro", category: "Business", preview: "/api/placeholder/300/200", price: "Free" },
    { id: 2, name: "E-commerce Plus", category: "E-commerce", preview: "/api/placeholder/300/200", price: "Premium" },
    { id: 3, name: "Creative Portfolio", category: "Portfolio", preview: "/api/placeholder/300/200", price: "Free" },
    { id: 4, name: "Agency Modern", category: "Agency", preview: "/api/placeholder/300/200", price: "Premium" },
    { id: 5, name: "Restaurant Deluxe", category: "Restaurant", preview: "/api/placeholder/300/200", price: "Premium" },
    { id: 6, name: "Blog Minimal", category: "Blog", preview: "/api/placeholder/300/200", price: "Free" },
  ]);

  const [selectedDevice, setSelectedDevice] = useState("desktop");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const [newWebsite, setNewWebsite] = useState({
    name: "",
    template: "",
    url: ""
  });

  const handleCreateWebsite = () => {
    if (!newWebsite.name || !newWebsite.template) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    const website = {
      id: websites.length + 1,
      name: newWebsite.name,
      url: newWebsite.url || newWebsite.name.toLowerCase().replace(/\s+/g, '-'),
      status: "Draft",
      template: newWebsite.template,
      lastEdited: new Date().toISOString().split('T')[0],
      visitors: 0,
      conversions: 0
    };

    setWebsites([...websites, website]);
    setNewWebsite({ name: "", template: "", url: "" });
    
    toast({
      title: "Success",
      description: "Website created successfully"
    });
  };

  const handlePublishWebsite = (id: number) => {
    setWebsites(websites.map(site => 
      site.id === id ? { ...site, status: "Published" } : site
    ));
    toast({
      title: "Published",
      description: "Website is now live"
    });
  };

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone
  };

  const buildingBlocks = [
    { name: "Header", icon: Layout, description: "Navigation and branding" },
    { name: "Hero Section", icon: Type, description: "Main headline and CTA" },
    { name: "Features", icon: Layout, description: "Service highlights" },
    { name: "Gallery", icon: ImageIcon, description: "Image carousel" },
    { name: "Video", icon: Video, description: "Embedded video content" },
    { name: "Testimonials", icon: Type, description: "Customer reviews" },
    { name: "Contact Form", icon: Layout, description: "Lead capture form" },
    { name: "Footer", icon: Layout, description: "Links and contact info" },
  ];

  const stats = [
    { label: "Total Websites", value: websites.length, icon: Globe, change: "+2" },
    { label: "Published", value: websites.filter(w => w.status === "Published").length, icon: Eye, change: "+1" },
    { label: "Total Visitors", value: websites.reduce((sum, w) => sum + w.visitors, 0).toLocaleString(), icon: Monitor, change: "+15%" },
    { label: "Conversions", value: websites.reduce((sum, w) => sum + w.conversions, 0), icon: Settings, change: "+8%" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Website Builder</h1>
            <p className="text-muted-foreground">Create stunning websites with drag-and-drop simplicity</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Website
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Website</DialogTitle>
                  <DialogDescription>Start building your website from a template</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="websiteName">Website Name *</Label>
                    <Input
                      id="websiteName"
                      value={newWebsite.name}
                      onChange={(e) => setNewWebsite({ ...newWebsite, name: e.target.value })}
                      placeholder="My Awesome Website"
                    />
                  </div>
                  <div>
                    <Label htmlFor="url">URL Slug</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">yourdomain.com/</span>
                      <Input
                        id="url"
                        value={newWebsite.url}
                        onChange={(e) => setNewWebsite({ ...newWebsite, url: e.target.value })}
                        placeholder="my-website"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="template">Template *</Label>
                    <Select value={newWebsite.template} onValueChange={(value) => setNewWebsite({ ...newWebsite, template: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.name}>
                            {template.name} ({template.price})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateWebsite} className="w-full">
                    Create Website
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
        <Tabs defaultValue="websites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="websites">My Websites</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="websites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Websites</CardTitle>
                <CardDescription>Manage all your created websites</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {websites.map((website) => (
                    <div key={website.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{website.name}</h3>
                          <Badge variant={website.status === 'Published' ? 'default' : 'outline'}>
                            {website.status}
                          </Badge>
                          <Badge variant="secondary">{website.template}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {website.status === 'Draft' && (
                            <Button 
                              size="sm" 
                              onClick={() => handlePublishWebsite(website.id)}
                            >
                              Publish
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">URL:</span>
                          <span className="ml-2 font-mono">/{website.url}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Edited:</span>
                          <span className="ml-2">{website.lastEdited}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Visitors:</span>
                          <span className="ml-2 font-medium">{website.visitors.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversions:</span>
                          <span className="ml-2 font-medium">{website.conversions}</span>
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
                <CardTitle>Website Templates</CardTitle>
                <CardDescription>Choose from our collection of professional templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card key={template.id} className="overflow-hidden group hover:shadow-lg transition-all">
                      <div className="relative">
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <Layout className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge variant={template.price === 'Free' ? 'secondary' : 'default'}>
                            {template.price}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{template.category}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Builder Sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Building Blocks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {buildingBlocks.map((block, index) => (
                      <div 
                        key={index}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <block.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{block.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{block.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Builder Canvas */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Website Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      {Object.entries(deviceIcons).map(([device, Icon]) => (
                        <Button
                          key={device}
                          size="sm"
                          variant={selectedDevice === device ? "default" : "outline"}
                          onClick={() => setSelectedDevice(device)}
                        >
                          <Icon className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`mx-auto border rounded-lg overflow-hidden ${
                    selectedDevice === 'desktop' ? 'max-w-full' : 
                    selectedDevice === 'tablet' ? 'max-w-2xl' : 
                    'max-w-sm'
                  }`}>
                    <div className="aspect-video bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
                      <div className="text-center">
                        <Layout className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Drag & Drop Builder</h3>
                        <p className="text-sm text-muted-foreground max-w-xs">
                          Drag elements from the sidebar to build your website
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Builder Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Design Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Palette className="w-6 h-6" />
                    <span className="text-sm">Colors</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Type className="w-6 h-6" />
                    <span className="text-sm">Typography</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm">Images</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                    <Code className="w-6 h-6" />
                    <span className="text-sm">Custom Code</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Domain Settings</CardTitle>
                  <CardDescription>Configure your website domains</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="customDomain">Custom Domain</Label>
                    <Input
                      id="customDomain"
                      placeholder="www.yourdomain.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex items-center mt-1">
                      <Input
                        id="subdomain"
                        placeholder="mysite"
                        className="rounded-r-none"
                      />
                      <span className="px-3 py-2 bg-muted border border-l-0 rounded-r-md text-sm">
                        .higherup.com
                      </span>
                    </div>
                  </div>
                  <Button>Update Domain</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>Optimize for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      placeholder="Your page title"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Input
                      id="metaDescription"
                      placeholder="Brief description of your page"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      placeholder="keyword1, keyword2, keyword3"
                      className="mt-1"
                    />
                  </div>
                  <Button>Update SEO</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Track your website performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="googleAnalytics">Google Analytics ID</Label>
                    <Input
                      id="googleAnalytics"
                      placeholder="GA-XXXXXXXXX-X"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facebookPixel">Facebook Pixel ID</Label>
                    <Input
                      id="facebookPixel"
                      placeholder="123456789012345"
                      className="mt-1"
                    />
                  </div>
                  <Button>Save Analytics</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                  <CardDescription>Optimize website speed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Image Optimization</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Caching</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Minification</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">CDN</span>
                    <Badge>Active</Badge>
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

export default WebsiteBuilder;