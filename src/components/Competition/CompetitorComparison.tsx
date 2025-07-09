import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  Target, 
  Sparkles,
  ArrowRight,
  Trophy,
  Star
} from "lucide-react";

const competitors = [
  {
    name: "Wix",
    logo: "🌐",
    price: "$16-59/mo",
    features: {
      "3D Animations": false,
      "AI Website Builder": "Limited",
      "E-commerce": "Basic",
      "Marketing Tools": "Limited",
      "CRM Integration": false,
      "Advanced Analytics": false,
      "White Label": false,
      "API Access": "Limited"
    },
    limitations: ["No advanced 3D", "Limited AI", "Expensive for features"]
  },
  {
    name: "Shopify",
    logo: "🛍️",
    price: "$29-299/mo",
    features: {
      "3D Animations": false,
      "AI Website Builder": false,
      "E-commerce": true,
      "Marketing Tools": "Basic",
      "CRM Integration": "Limited",
      "Advanced Analytics": "Paid Add-on",
      "White Label": false,
      "API Access": true
    },
    limitations: ["E-commerce only", "No website builder", "Expensive apps"]
  },
  {
    name: "AdsCreative.ai",
    logo: "🎨",
    price: "$21-166/mo",
    features: {
      "3D Animations": false,
      "AI Website Builder": false,
      "E-commerce": false,
      "Marketing Tools": "AI Ads Only",
      "CRM Integration": false,
      "Advanced Analytics": "Limited",
      "White Label": false,
      "API Access": "Limited"
    },
    limitations: ["Ads only", "No website features", "Limited scope"]
  },
  {
    name: "Dora.run",
    logo: "✨",
    price: "$14-40/mo",
    features: {
      "3D Animations": "Basic",
      "AI Website Builder": "Limited",
      "E-commerce": false,
      "Marketing Tools": false,
      "CRM Integration": false,
      "Advanced Analytics": false,
      "White Label": false,
      "API Access": false
    },
    limitations: ["No marketing tools", "No e-commerce", "Limited AI"]
  },
  {
    name: "HigherUp.ai",
    logo: "🚀",
    price: "$9-49/mo",
    isUs: true,
    features: {
      "3D Animations": true,
      "AI Website Builder": true,
      "E-commerce": true,
      "Marketing Tools": true,
      "CRM Integration": true,
      "Advanced Analytics": true,
      "White Label": true,
      "API Access": true
    },
    advantages: ["All-in-one platform", "Advanced AI", "Best value", "Superior 3D"]
  }
];

const featureList = [
  "3D Animations",
  "AI Website Builder", 
  "E-commerce",
  "Marketing Tools",
  "CRM Integration",
  "Advanced Analytics",
  "White Label",
  "API Access"
];

export const CompetitorComparison = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-muted/30 via-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 border-yellow-500/20">
            <Trophy className="w-4 h-4 mr-2" />
            Honest Comparison
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why HigherUp.ai Beats
            <br />
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              Every Competitor
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            See the side-by-side comparison that shows why leading businesses are switching from 
            expensive, limited platforms to our comprehensive solution.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="overflow-x-auto mb-12"
        >
          <div className="min-w-[800px] bg-background/50 backdrop-blur-sm rounded-2xl border-2 border-primary/20 p-6">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 mb-6 pb-4 border-b border-muted">
              <div className="text-left">
                <h3 className="font-semibold text-lg">Platform</h3>
                <p className="text-sm text-muted-foreground">Monthly Price</p>
              </div>
              {competitors.map((competitor, index) => (
                <div key={index} className={`text-center ${competitor.isUs ? 'bg-gradient-to-b from-primary/10 to-secondary/10 rounded-xl p-3 border-2 border-primary/30' : ''}`}>
                  <div className="text-2xl mb-2">{competitor.logo}</div>
                  <div className={`font-semibold ${competitor.isUs ? 'text-primary' : ''}`}>
                    {competitor.name}
                    {competitor.isUs && <Crown className="w-4 h-4 inline ml-1 text-yellow-500" />}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{competitor.price}</div>
                </div>
              ))}
            </div>

            {/* Feature Rows */}
            {featureList.map((feature, featureIndex) => (
              <div key={featureIndex} className="grid grid-cols-6 gap-4 py-3 border-b border-muted/50 hover:bg-muted/20 transition-colors">
                <div className="font-medium">{feature}</div>
                {competitors.map((competitor, compIndex) => (
                  <div key={compIndex} className="text-center">
                    {typeof competitor.features[feature as keyof typeof competitor.features] === 'boolean' ? (
                      competitor.features[feature as keyof typeof competitor.features] ? (
                        <Check className={`w-5 h-5 mx-auto ${competitor.isUs ? 'text-green-500' : 'text-green-400'}`} />
                      ) : (
                        <X className="w-5 h-5 mx-auto text-red-400" />
                      )
                    ) : (
                      <Badge variant={competitor.isUs ? "default" : "secondary"} className="text-xs">
                        {competitor.features[feature as keyof typeof competitor.features] as string}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Competitor Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {competitors.filter(c => !c.isUs).map((competitor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border border-muted hover:border-red-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{competitor.logo}</span>
                    <div>
                      <CardTitle className="text-lg">{competitor.name}</CardTitle>
                      <CardDescription>{competitor.price}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2 flex items-center">
                        <X className="w-4 h-4 mr-1" />
                        Limitations:
                      </h4>
                      <ul className="space-y-1">
                        {competitor.limitations?.map((limitation, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center">
                            <span className="w-1 h-1 bg-red-400 rounded-full mr-2" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Our Advantages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <Card className="max-w-4xl mx-auto border-2 border-primary/30 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
            <CardContent className="p-12">
              <div className="flex items-center justify-center mb-8">
                <Crown className="w-12 h-12 text-yellow-500 mr-4" />
                <div>
                  <h3 className="text-3xl font-bold mb-2 flex items-center">
                    Why We're #1
                    <Star className="w-6 h-6 text-yellow-500 ml-2" />
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    The only platform that gives you everything in one place
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {competitors.find(c => c.isUs)?.advantages?.map((advantage, i) => (
                  <div key={i} className="flex items-center text-left">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="font-medium">{advantage}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Your Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10">
                  <Target className="w-5 h-5 mr-2" />
                  See Feature Comparison
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                Save $200+ per month by replacing 5+ separate tools with one platform
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CompetitorComparison;