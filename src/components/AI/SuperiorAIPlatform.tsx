import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Zap, 
  Brain, 
  Sparkles, 
  Target, 
  BarChart3, 
  Palette, 
  Video, 
  MessageSquare,
  ShoppingCart,
  Mail,
  Globe,
  Rocket,
  TrendingUp,
  Eye,
  Cpu,
  Wand2
} from "lucide-react";

const aiFeatures = [
  {
    icon: Brain,
    title: "AI Website Generator",
    description: "Generate complete websites in seconds with our advanced AI that understands design, UX, and conversion optimization",
    badge: "10x Faster than Wix",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Palette,
    title: "AI Creative Suite",
    description: "Generate ads, banners, videos, and graphics that outperform competitors by 300%",
    badge: "Better than AdsCreative.ai",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Video,
    title: "AI Video Creator",
    description: "Create professional marketing videos, product demos, and 3D animations instantly",
    badge: "No Code Required",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: MessageSquare,
    title: "AI Copy Generator",
    description: "Write high-converting sales copy, emails, and marketing content that sells",
    badge: "95% Conversion Rate",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: Target,
    title: "AI Funnel Builder",
    description: "Build complete sales funnels with AI-optimized landing pages and automation",
    badge: "14x ROI Increase",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: BarChart3,
    title: "AI Analytics",
    description: "Get predictive insights and optimization recommendations in real-time",
    badge: "Predict Success",
    color: "from-teal-500 to-green-500"
  }
];

const aiStats = [
  { number: "10x", label: "Faster than Dora.run", icon: Rocket },
  { number: "300%", label: "Better Performance", icon: TrendingUp },
  { number: "95%", label: "Success Rate", icon: Target },
  { number: "14x", label: "ROI Increase", icon: BarChart3 }
];

export const SuperiorAIPlatform = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 max-w-4xl mx-auto"
        >
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Cpu className="w-4 h-4 mr-2" />
            Next-Gen AI Platform
          </Badge>
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            The Most Advanced AI Platform
            <br />
            <span className="text-4xl">That Makes Competitors Obsolete</span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            While others offer basic tools, we provide the complete AI ecosystem that replaces 
            <span className="font-semibold text-foreground"> Wix + Shopify + AdsCreative.ai + Dora.run + 20 other tools</span>
          </p>
          
          {/* Competitor Comparison */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {["Wix", "Shopify", "AdsCreative.ai", "Dora.run", "ClickFunnels"].map((competitor) => (
              <Badge key={competitor} variant="outline" className="text-muted-foreground">
                <span className="line-through">{competitor}</span>
                <span className="ml-2 text-primary">✓ Replaced</span>
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* AI Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
        >
          {aiStats.map((stat, index) => (
            <Card key={index} className="text-center border-2 border-primary/20 bg-gradient-to-b from-background to-muted/30">
              <CardContent className="pt-6">
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                <div className="text-3xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* AI Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {aiFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="group"
            >
              <Card className="h-full border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5">
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-6">
                <Wand2 className="w-12 h-12 text-primary mr-4" />
                <div>
                  <h3 className="text-3xl font-bold mb-2">Ready to Replace All Your Tools?</h3>
                  <p className="text-lg text-muted-foreground">
                    Join 50,000+ businesses who switched from multiple platforms to our all-in-one AI solution
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Building with AI
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
                  <Eye className="w-5 h-5 mr-2" />
                  See Live Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};