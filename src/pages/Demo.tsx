import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { NextGenInteractive3D } from '@/components/Three/NextGenInteractive3D';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet,
  Eye,
  MousePointer,
  Sparkles
} from 'lucide-react';

const Demo = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const demoSections = [
    {
      title: "3D Interactive Elements",
      description: "Experience next-generation 3D interactions that respond to your mouse movements",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "AI-Powered Design",
      description: "Watch our AI generate complete websites, funnels, and marketing materials",
      icon: Zap,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Real-time Collaboration",
      description: "See how teams work together in our unified platform",
      icon: Eye,
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/50 to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">HigherUp.ai</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
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

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Play className="w-4 h-4 mr-2" />
            Interactive Demo
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            See HigherUp.ai in Action
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Experience the power of our platform with this interactive demo. 
            Hover, click, and explore the features that make us 1000× better than competitors.
          </p>
        </motion.div>

        {/* Device Mockup Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center space-x-2 bg-muted/50 backdrop-blur-sm p-2 rounded-lg">
            <Button
              variant={viewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('desktop')}
            >
              <Monitor className="w-4 h-4 mr-2" />
              Desktop
            </Button>
            <Button
              variant={viewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tablet')}
            >
              <Tablet className="w-4 h-4 mr-2" />
              Tablet
            </Button>
            <Button
              variant={viewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mobile')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile
            </Button>
          </div>
        </motion.div>

        {/* Main Demo Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          <Card className={`mx-auto border-2 border-primary/30 bg-gradient-to-br from-background to-muted/30 shadow-2xl ${
            viewMode === 'desktop' ? 'max-w-6xl' : 
            viewMode === 'tablet' ? 'max-w-4xl' : 
            'max-w-md'
          }`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Interactive 3D Experience</CardTitle>
                  <CardDescription>
                    Hover over the elements and see the magic happen
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl overflow-hidden ${
                viewMode === 'desktop' ? 'h-96' : 
                viewMode === 'tablet' ? 'h-80' : 
                'h-64'
              }`}>
                <NextGenInteractive3D />
              </div>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="w-4 h-4 text-primary" />
                    <span>Move your mouse to interact</span>
                  </div>
                  <Badge variant="outline">
                    Better than Dora.run
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Demo Sections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid md:grid-cols-3 gap-8 mb-16"
        >
          {demoSections.map((section, index) => (
            <Card key={index} className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 group">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {section.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-6">Ready to Build Your Own?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start creating stunning 3D websites, funnels, and marketing campaigns with our AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth?mode=signup">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/features">
                  <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 px-8 py-3">
                    <Eye className="w-5 h-5 mr-2" />
                    Explore Features
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

export default Demo;