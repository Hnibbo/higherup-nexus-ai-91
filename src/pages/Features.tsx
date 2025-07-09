import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Users, 
  Megaphone, 
  Palette, 
  Bot, 
  Video, 
  Mail, 
  BarChart3, 
  Globe, 
  CreditCard,
  Smartphone,
  Calendar,
  Building,
  ShoppingCart,
  Target,
  Brain,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  Crown,
  Rocket,
  Eye,
  MousePointer,
  Layers,
  Code,
  Wand2
} from 'lucide-react';

const Features = () => {
  const [activeCategory, setActiveCategory] = useState('website');

  const featureCategories = {
    website: {
      title: "Website & Design",
      icon: Palette,
      color: "from-blue-500 to-cyan-500",
      features: [
        {
          icon: Wand2,
          title: "AI Website Builder",
          description: "Generate complete websites in seconds with AI that understands design, UX, and conversion optimization",
          highlights: ["10x faster than Wix", "SEO optimized", "Mobile responsive", "Custom code export"]
        },
        {
          icon: Layers,
          title: "3D Animation Studio",
          description: "Create stunning 3D animations and interactions without any coding knowledge",
          highlights: ["Better than Dora.run", "Mouse interactions", "Floating elements", "Custom materials"]
        },
        {
          icon: Code,
          title: "Drag & Drop Builder",
          description: "Visual editor with unlimited customization options and real-time preview",
          highlights: ["100+ components", "Custom CSS", "Responsive design", "Version control"]
        },
        {
          icon: Globe,
          title: "Multi-language Support",
          description: "Create websites in multiple languages with automatic translation",
          highlights: ["50+ languages", "RTL support", "Currency conversion", "Geo-targeting"]
        }
      ]
    },
    marketing: {
      title: "Marketing & AI",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      features: [
        {
          icon: Target,
          title: "AI Ad Generator",
          description: "Create high-converting ads, banners, and marketing materials instantly",
          highlights: ["300% better CTR", "A/B testing", "Multi-platform", "Brand consistency"]
        },
        {
          icon: Mail,
          title: "Email Marketing",
          description: "Automated email campaigns with AI-powered personalization",
          highlights: ["Smart segmentation", "Behavioral triggers", "Deliverability optimization", "Analytics"]
        },
        {
          icon: Smartphone,
          title: "SMS Marketing",
          description: "Reach customers instantly with targeted SMS campaigns",
          highlights: ["Global reach", "Two-way messaging", "Automation", "Compliance tools"]
        },
        {
          icon: Megaphone,
          title: "Social Media Manager",
          description: "Schedule and manage content across all social platforms",
          highlights: ["Multi-platform", "Content calendar", "Engagement tracking", "Hashtag research"]
        }
      ]
    },
    sales: {
      title: "Sales & CRM",
      icon: Users,
      color: "from-orange-500 to-red-500",
      features: [
        {
          icon: Users,
          title: "Advanced CRM",
          description: "Manage leads, customers, and deals with AI-powered insights",
          highlights: ["360° customer view", "Pipeline management", "Task automation", "Reporting dashboard"]
        },
        {
          icon: Target,
          title: "Sales Funnels",
          description: "Build high-converting sales funnels with drag-and-drop simplicity",
          highlights: ["Conversion optimization", "A/B testing", "Analytics", "Integration ready"]
        },
        {
          icon: Calendar,
          title: "Appointment Booking",
          description: "Automated scheduling system with calendar integration",
          highlights: ["Smart scheduling", "Reminders", "Time zones", "Payment integration"]
        },
        {
          icon: Building,
          title: "Lead Generation",
          description: "Capture and nurture leads with intelligent forms and pop-ups",
          highlights: ["Smart forms", "Exit intent", "Progressive profiling", "Lead scoring"]
        }
      ]
    },
    ecommerce: {
      title: "E-commerce",
      icon: ShoppingCart,
      color: "from-green-500 to-emerald-500",
      features: [
        {
          icon: ShoppingCart,
          title: "Online Store",
          description: "Complete e-commerce solution with inventory management",
          highlights: ["Product catalog", "Order management", "Shipping integration", "Tax calculation"]
        },
        {
          icon: CreditCard,
          title: "Payment Processing",
          description: "Accept payments worldwide with secure checkout",
          highlights: ["Multiple gateways", "Fraud protection", "Subscription billing", "Mobile payments"]
        },
        {
          icon: BarChart3,
          title: "Analytics & Reports",
          description: "Track sales, customers, and performance with detailed analytics",
          highlights: ["Real-time data", "Custom reports", "Forecasting", "ROI tracking"]
        },
        {
          icon: Bot,
          title: "AI Recommendations",
          description: "Boost sales with AI-powered product recommendations",
          highlights: ["Personalized suggestions", "Upselling", "Cross-selling", "Dynamic pricing"]
        }
      ]
    },
    content: {
      title: "Content & Media",
      icon: Video,
      color: "from-teal-500 to-green-500",
      features: [
        {
          icon: Video,
          title: "AI Video Creator",
          description: "Generate professional videos from text with AI avatars and voices",
          highlights: ["Text-to-video", "AI avatars", "Voice cloning", "Multi-language"]
        },
        {
          icon: Palette,
          title: "Image Editor",
          description: "Professional photo editing with AI-powered tools",
          highlights: ["Background removal", "Style transfer", "Smart cropping", "Batch processing"]
        },
        {
          icon: Brain,
          title: "Content Generator",
          description: "AI-powered copywriting for all your marketing needs",
          highlights: ["Blog posts", "Ad copy", "Social content", "SEO optimization"]
        },
        {
          icon: Globe,
          title: "Asset Library",
          description: "Access millions of stock photos, videos, and graphics",
          highlights: ["Commercial license", "High resolution", "Regular updates", "Search by AI"]
        }
      ]
    }
  };

  const stats = [
    { number: "50,000+", label: "Active Users", icon: Users },
    { number: "1M+", label: "Websites Created", icon: Globe },
    { number: "99.9%", label: "Uptime", icon: Zap },
    { number: "24/7", label: "Support", icon: Bot }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HigherUp.ai</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/features" className="text-foreground font-medium">
              Features
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/demo" className="text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </Link>
          </nav>
          <div className="flex items-center space-x-3">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 border-yellow-500/20">
            <Crown className="w-4 h-4 mr-2" />
            Complete Feature Set
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Dominate Your Market
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8">
            Discover the comprehensive suite of tools that makes HigherUp.ai the ultimate 
            all-in-one platform for modern businesses and agencies.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-2 border-primary/20 bg-gradient-to-b from-background to-muted/30">
              <CardContent className="pt-6">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Feature Categories */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-16"
        >
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8 bg-muted/50 backdrop-blur-sm">
              {Object.entries(featureCategories).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
                  <category.icon className="w-4 h-4" />
                  <span className="hidden md:block">{category.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(featureCategories).map(([key, category]) => (
              <TabsContent key={key} value={key}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* Category Header */}
                  <div className="text-center mb-12">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{category.title}</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      Professional-grade tools that rival industry leaders
                    </p>
                  </div>

                  {/* Features Grid */}
                  <div className="grid md:grid-cols-2 gap-8">
                    {category.features.map((feature, index) => (
                      <Card key={index} className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                              <feature.icon className="w-6 h-6" />
                            </div>
                            <Badge className="bg-primary/10 text-primary border-primary/20">New</Badge>
                          </div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {feature.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-muted-foreground mb-4 leading-relaxed">
                            {feature.description}
                          </CardDescription>
                          <div className="space-y-2">
                            {feature.highlights.map((highlight, i) => (
                              <div key={i} className="flex items-center text-sm">
                                <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                <span>{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <Rocket className="w-16 h-16 text-primary mr-6" />
                <div className="text-left">
                  <h2 className="text-4xl font-bold mb-3">Ready to Get Started?</h2>
                  <p className="text-xl text-muted-foreground">
                    Join thousands of businesses already using HigherUp.ai
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">Free</div>
                  <div className="text-sm text-muted-foreground">14-day trial</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">$0</div>
                  <div className="text-sm text-muted-foreground">Setup fees</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">24/7</div>
                  <div className="text-sm text-muted-foreground">Support included</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-12 py-4 text-lg">
                    <Star className="w-6 h-6 mr-2" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 px-8 py-4 text-lg">
                    <Eye className="w-6 h-6 mr-2" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Features;