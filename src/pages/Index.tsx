import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Users, TrendingUp, Globe, Palette, Bot, Video, Mail, BarChart, Megaphone, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      icon: Users,
      title: "Advanced CRM",
      description: "Unified contact management with AI-powered insights and automation"
    },
    {
      icon: Megaphone,
      title: "Marketing Automation",
      description: "Email, SMS, and omnichannel campaigns with intelligent workflows"
    },
    {
      icon: Palette,
      title: "3D Funnel Builder",
      description: "Revolutionary drag-and-drop builder with immersive 3D interface"
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description: "Interactive avatar that builds campaigns, writes content, and optimizes performance"
    },
    {
      icon: Video,
      title: "Video Creator",
      description: "AI-powered video generation with person cloning and product integration"
    },
    {
      icon: BarChart,
      title: "Advanced Analytics",
      description: "Real-time dashboards with predictive insights and ROI tracking"
    },
    {
      icon: Globe,
      title: "White-Label Ready",
      description: "Complete rebrandable solution for agencies and resellers"
    },
    {
      icon: CreditCard,
      title: "Native E-commerce",
      description: "Built-in payment processing, inventory management, and order tracking"
    }
  ];

  const stats = [
    { value: "1000x", label: "Better than GoHighLevel" },
    { value: "50+", label: "Integrated Tools" },
    { value: "24/7", label: "AI Support" },
    { value: "99.9%", label: "Uptime SLA" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HigherUp.ai</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-6 animate-pulse">
          🚀 The Future of All-in-One Marketing
        </Badge>
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
          HigherUp.ai
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          The ultimate all-in-one platform that's 1000× better than GoHighLevel. 
          Build funnels, manage customers, create content, and scale your business with AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link to="/auth?mode=signup">
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Start Building Now
              <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
            </Button>
          </Link>
          <Link to="/demo">
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg">
              Watch Demo
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Replace dozens of tools with one powerful platform. Built for agencies, 
            businesses, and entrepreneurs who demand excellence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using HigherUp.ai to automate, 
              scale, and dominate their markets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="h-12 px-8">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" size="lg" className="h-12 px-8">
                  View Pricing
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">HigherUp.ai</span>
              </div>
              <p className="text-muted-foreground">
                The ultimate all-in-one platform for modern businesses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <div className="space-y-2 text-muted-foreground">
                <div>Dashboard</div>
                <div>CRM</div>
                <div>Automation</div>
                <div>Analytics</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tools</h4>
              <div className="space-y-2 text-muted-foreground">
                <div>Funnel Builder</div>
                <div>Email Marketing</div>
                <div>Video Creator</div>
                <div>AI Assistant</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-muted-foreground">
                <div>About</div>
                <div>Contact</div>
                <div>Support</div>
                <div>Docs</div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 HigherUp.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;