import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { ArrowRight, Zap, Users, TrendingUp, Globe, Palette, Bot, Video, Mail, BarChart, Megaphone, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Scene3D } from "@/components/Three/Scene3D";
import { InteractiveHero } from "@/components/Three/InteractiveHero";
import { NextGenInteractive3D } from "@/components/Three/NextGenInteractive3D";
import { SuperiorAIPlatform } from "@/components/AI/SuperiorAIPlatform";
import { CompetitorComparison } from "@/components/Competition/CompetitorComparison";
import { UltimateAllInOne } from "@/components/Ultimate/UltimateAllInOne";
import { motion } from "framer-motion";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5 relative overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <Suspense fallback={null}>
          <Scene3D interactive={false} />
        </Suspense>
      </div>
      
      <div className="relative z-10">
        {/* Mobile-First Header */}
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50 safe-area-inset">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Zap className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <span className="text-lg sm:text-xl font-bold">HigherUp.ai</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors hover-lift">
                Dashboard
              </Link>
              <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors hover-lift">
                Features
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors hover-lift">
                Pricing
              </Link>
              <Link to="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors hover-lift">
                Marketplace
              </Link>
            </nav>
            
            {/* Mobile & Desktop Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" className="hover-lift">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button className="gradient-bg hover:shadow-lg hover-lift text-sm sm:text-base px-3 sm:px-4">
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile-First Hero Section */}
        <section className="relative py-12 sm:py-20 px-4 sm:px-6 overflow-hidden min-h-screen flex items-center safe-area-inset">
          {/* Enhanced 3D Hero Background */}
          <div className="absolute inset-0 opacity-30 sm:opacity-40">
            <Suspense fallback={null}>
              <InteractiveHero />
            </Suspense>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10 w-full">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center space-y-6 sm:space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge variant="secondary" className="mb-4 sm:mb-6 animate-pulse-glow backdrop-blur-sm bg-background/60 text-xs sm:text-sm">
                  🚀 The Future of All-in-One Marketing
                </Badge>
              </motion.div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 gradient-text animate-fade-in">
                HigherUp.ai
              </h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto backdrop-blur-sm bg-background/30 p-4 sm:p-6 rounded-lg"
              >
                The ultimate all-in-one platform that's 1000× better than GoHighLevel. 
                Build funnels, manage customers, create content, and scale your business with AI.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12"
              >
                <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg group gradient-bg hover:shadow-glow hover-lift"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    Start Building Now
                    <ArrowRight className={`ml-2 h-4 h-5 w-4 sm:w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                  </Button>
                </Link>
                <Link to="/demo" className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg backdrop-blur-sm bg-background/60 border-primary/30 hover-lift"
                  >
                    Watch Demo
                  </Button>
                </Link>
              </motion.div>

              {/* Mobile-Optimized Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center backdrop-blur-sm bg-background/30 p-3 sm:p-4 rounded-lg hover-lift glass"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2 gradient-text">
                      {stat.value}
                    </div>
                    <div className="text-sm sm:text-base text-muted-foreground">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <Badge variant="outline" className="mb-4 backdrop-blur-sm bg-background/60">All-in-One Platform</Badge>
              <h2 className="text-4xl font-bold mb-4">Everything You Need to Dominate</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Replace dozens of tools with one powerful platform. Built for agencies, 
                businesses, and entrepreneurs who demand excellence.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-background/60 border-primary/10 hover:border-primary/30 h-full">
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
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Next-Gen 3D Demo */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Experience Next-Gen 3D Interactions</h2>
            <p className="text-xl text-muted-foreground mb-8">Better than Dora.run - Try hovering and clicking!</p>
          </div>
          <div className="h-96 rounded-3xl border-2 border-primary/30 overflow-hidden">
            <NextGenInteractive3D />
          </div>
        </section>

        {/* Superior AI Platform */}
        <SuperiorAIPlatform />
        
        {/* Ultimate All-in-One Solution */}
        <UltimateAllInOne />
        
        {/* Competitor Comparison */}
        <CompetitorComparison />

        {/* Footer */}
        <footer className="border-t bg-background/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-12">
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
    </div>
  );
};

export default Index;