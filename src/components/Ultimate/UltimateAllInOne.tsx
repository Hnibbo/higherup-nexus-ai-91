import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Globe, 
  ShoppingCart, 
  Mail, 
  MessageSquare, 
  BarChart3, 
  Users, 
  Palette, 
  Video, 
  Zap,
  Brain,
  Target,
  Rocket,
  Crown,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Wand2,
  Database,
  Shield,
  Code,
  Headphones
} from "lucide-react";

const allInOneFeatures = [
  {
    category: "Website & Design",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    tools: [
      { name: "AI Website Builder", description: "Create stunning websites in minutes", replaces: "Wix, Webflow" },
      { name: "3D Animation Studio", description: "No-code 3D animations and interactions", replaces: "Dora.run, Spline" },
      { name: "Drag & Drop Editor", description: "Visual editor with unlimited customization", replaces: "Elementor, Figma" },
      { name: "Template Library", description: "1000+ professional templates", replaces: "ThemeForest" }
    ]
  },
  {
    category: "E-commerce",
    icon: ShoppingCart,
    color: "from-green-500 to-emerald-500",
    tools: [
      { name: "Online Store Builder", description: "Complete e-commerce solution", replaces: "Shopify, WooCommerce" },
      { name: "Inventory Management", description: "Track products, orders, and stock", replaces: "TradeGecko" },
      { name: "Payment Processing", description: "Accept payments worldwide", replaces: "Stripe, PayPal" },
      { name: "Shipping Integration", description: "Connect with all major carriers", replaces: "ShipStation" }
    ]
  },
  {
    category: "Marketing & AI",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
    tools: [
      { name: "AI Ad Generator", description: "Create high-converting ads instantly", replaces: "AdsCreative.ai" },
      { name: "Email Marketing", description: "Automated email campaigns", replaces: "Mailchimp, ConvertKit" },
      { name: "SMS Marketing", description: "Text message campaigns", replaces: "Twilio, Klaviyo" },
      { name: "Social Media Manager", description: "Schedule and manage all platforms", replaces: "Hootsuite, Later" }
    ]
  },
  {
    category: "Sales & CRM",
    icon: Users,
    color: "from-orange-500 to-red-500",
    tools: [
      { name: "CRM System", description: "Manage leads and customers", replaces: "Salesforce, HubSpot" },
      { name: "Sales Funnels", description: "Build high-converting funnels", replaces: "ClickFunnels" },
      { name: "Lead Generation", description: "Capture and nurture leads", replaces: "Leadpages" },
      { name: "Appointment Booking", description: "Automated scheduling system", replaces: "Calendly" }
    ]
  },
  {
    category: "Analytics & Growth",
    icon: BarChart3,
    color: "from-indigo-500 to-purple-500",
    tools: [
      { name: "Advanced Analytics", description: "Track performance and ROI", replaces: "Google Analytics Pro" },
      { name: "A/B Testing", description: "Optimize for better conversions", replaces: "Optimizely" },
      { name: "Heatmaps & Recordings", description: "See how users interact", replaces: "Hotjar, Crazy Egg" },
      { name: "SEO Optimization", description: "Rank higher on search engines", replaces: "SEMrush, Ahrefs" }
    ]
  },
  {
    category: "Content & Media",
    icon: Video,
    color: "from-teal-500 to-green-500",
    tools: [
      { name: "AI Video Creator", description: "Generate videos from text", replaces: "Loom, Synthesia" },
      { name: "Image Editor", description: "Professional photo editing", replaces: "Photoshop, Canva Pro" },
      { name: "Content Generator", description: "AI-powered copywriting", replaces: "Copy.ai, Jasper" },
      { name: "Asset Library", description: "Million+ stock photos and videos", replaces: "Shutterstock" }
    ]
  }
];

const competitorReplacements = [
  { name: "Wix", cost: "$59/mo", features: "Website Builder" },
  { name: "Shopify", cost: "$299/mo", features: "E-commerce" },
  { name: "AdsCreative.ai", cost: "$166/mo", features: "AI Ads" },
  { name: "Dora.run", cost: "$40/mo", features: "3D Animations" },
  { name: "ClickFunnels", cost: "$297/mo", features: "Sales Funnels" },
  { name: "Mailchimp", cost: "$99/mo", features: "Email Marketing" },
  { name: "HubSpot", cost: "$450/mo", features: "CRM" },
  { name: "Canva Pro", cost: "$40/mo", features: "Design Tools" }
];

const totalSavings = competitorReplacements.reduce((sum, tool) => sum + parseInt(tool.cost.replace(/[^0-9]/g, '')), 0);

export const UltimateAllInOne = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-secondary/3 to-accent/3" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 border-yellow-500/20">
            <Crown className="w-4 h-4 mr-2" />
            Ultimate All-in-One Platform
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Replace 20+ Tools with
            <br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              One Powerful Platform
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Stop paying for multiple subscriptions. Get everything you need to build, market, and grow your business 
            in one unified platform that costs less than a single competitor tool.
          </p>
        </motion.div>

        {/* Cost Savings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <Card className="max-w-5xl mx-auto border-2 border-red-200 bg-gradient-to-r from-red-50/50 to-orange-50/50">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2 text-red-600">What You're Currently Paying</h3>
                <p className="text-muted-foreground">Individual tool costs vs our all-in-one solution</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-4 text-red-600">❌ Separate Tools Cost:</h4>
                  <div className="space-y-2 mb-4">
                    {competitorReplacements.map((tool, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm">{tool.name} - {tool.features}</span>
                        <span className="font-semibold text-red-600">{tool.cost}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center text-lg font-bold text-red-600">
                    <span>Total Monthly Cost:</span>
                    <span>${totalSavings}/mo</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-4 text-green-600">✅ HigherUp.ai All-in-One:</h4>
                  <div className="p-6 bg-green-50 rounded-lg text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">$49/mo</div>
                    <div className="text-sm text-muted-foreground mb-4">Everything included</div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Save ${totalSavings - 49}/mo
                    </Badge>
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        Annual Savings: ${(totalSavings - 49) * 12}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        That's enough for a vacation! 🏖️
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feature Categories */}
        <div className="space-y-12 mb-16">
          {allInOneFeatures.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
            >
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-muted/20 to-background">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl bg-gradient-to-r ${category.color} text-white`}>
                      <category.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{category.category}</CardTitle>
                      <CardDescription className="text-lg">
                        Complete suite of {category.tools.length} professional tools
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.tools.map((tool, toolIndex) => (
                      <div key={toolIndex} className="p-4 border border-muted rounded-lg hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{tool.name}</h4>
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                        <Badge variant="outline" className="text-xs">
                          Replaces: {tool.replaces}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-accent" />
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <Rocket className="w-16 h-16 text-primary mr-6" />
                <div className="text-left">
                  <h3 className="text-4xl font-bold mb-3">Ready to Replace Everything?</h3>
                  <p className="text-xl text-muted-foreground">
                    Join 50,000+ businesses saving $1000s per month
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">50,000+</div>
                  <div className="text-sm text-muted-foreground">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary">$1,400</div>
                  <div className="text-sm text-muted-foreground">Average Monthly Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-accent">20+</div>
                  <div className="text-sm text-muted-foreground">Tools Replaced</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-12 py-4 text-lg">
                  <Star className="w-6 h-6 mr-2" />
                  Start Free Trial - Save $1,400/mo
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 px-8 py-4 text-lg">
                  <Sparkles className="w-6 h-6 mr-2" />
                  See All Features
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center">
                  <Shield className="w-4 h-4 mr-1" />
                  30-Day Money Back
                </span>
                <span className="flex items-center">
                  <Headphones className="w-4 h-4 mr-1" />
                  24/7 Support
                </span>
                <span className="flex items-center">
                  <Code className="w-4 h-4 mr-1" />
                  No Setup Required
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default UltimateAllInOne;