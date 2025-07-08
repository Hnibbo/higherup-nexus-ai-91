import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Users, TrendingUp, Globe, Shield, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$47",
      period: "/month",
      description: "Perfect for small businesses and startups",
      popular: false,
      features: [
        "Up to 1,000 contacts",
        "5 active funnels",
        "Email marketing (10K sends/month)",
        "Basic CRM",
        "Landing page builder",
        "AI assistant (50 queries/month)",
        "Basic analytics",
        "24/7 email support"
      ],
      credits: "100 AI credits included",
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: "$97",
      period: "/month",
      description: "Most popular for growing businesses",
      popular: true,
      features: [
        "Up to 10,000 contacts",
        "Unlimited funnels",
        "Email + SMS marketing (50K sends/month)",
        "Advanced CRM with automation",
        "Website + funnel builder",
        "AI assistant (500 queries/month)",
        "Video creator (10 videos/month)",
        "Advanced analytics",
        "White-label options",
        "Priority support"
      ],
      credits: "500 AI credits included",
      cta: "Start Free Trial"
    },
    {
      name: "Agency",
      price: "$297",
      period: "/month",
      description: "Built for agencies and enterprises",
      popular: false,
      features: [
        "Unlimited contacts",
        "Unlimited everything",
        "Unlimited email + SMS",
        "Full CRM suite",
        "Complete website builder",
        "Unlimited AI assistant",
        "Unlimited video creation",
        "Advanced automation engine",
        "Full white-label rebrand",
        "Client sub-accounts",
        "API access",
        "Dedicated account manager"
      ],
      credits: "2,000 AI credits included",
      cta: "Start Free Trial"
    }
  ];

  const addOns = [
    {
      name: "Extra AI Credits",
      price: "$29",
      description: "Additional 1,000 AI credits for power users",
      icon: Zap
    },
    {
      name: "Premium Templates",
      price: "$97",
      description: "Access to 500+ premium funnel and website templates",
      icon: Star
    },
    {
      name: "Advanced Training",
      price: "$197",
      description: "1-on-1 coaching and advanced strategy sessions",
      icon: Users
    },
    {
      name: "Custom Integration",
      price: "$497",
      description: "Custom API integrations and development",
      icon: TrendingUp
    }
  ];

  const faqs = [
    {
      question: "How does the 14-day free trial work?",
      answer: "Start with full access to all Professional plan features. No credit card required. Cancel anytime within 14 days with no charges."
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer: "Yes! Change your plan instantly. Upgrades take effect immediately, downgrades at your next billing cycle."
    },
    {
      question: "What are AI credits used for?",
      answer: "AI credits power content generation, video creation, automation suggestions, and AI assistant interactions. Extra credits can be purchased as needed."
    },
    {
      question: "Is there a setup fee?",
      answer: "No setup fees ever. We also provide free onboarding and migration assistance for all paid plans."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes! 30-day money-back guarantee on all plans. If you're not satisfied, we'll refund your payment in full."
    },
    {
      question: "Can I white-label the platform?",
      answer: "Professional and Agency plans include white-label options. Fully rebrand with your logo, colors, and domain."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
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
            <Link to="/pricing" className="text-foreground font-medium">
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

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6">
            💎 14-Day Free Trial • No Credit Card Required
          </Badge>
          <h1 className="text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Choose the perfect plan for your business. All plans include our complete platform 
            with AI-powered tools, automation, and 24/7 support. Upgrade or cancel anytime.
          </p>
          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-600" />
              <span>30-day money back</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-2xl scale-105' : 'hover:shadow-lg'} transition-all duration-300`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  🚀 Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <Badge variant="outline" className="mt-2">
                  {plan.credits}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/auth?mode=signup" className="block">
                  <Button 
                    className={`w-full h-12 ${plan.popular ? '' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise Section */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 mb-16">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Need Something Custom?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Enterprise plans with custom features, dedicated infrastructure, 
              and white-glove onboarding for teams of 100+ users.
            </p>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="flex flex-col items-center">
                <Shield className="w-8 h-8 text-primary mb-2" />
                <h4 className="font-semibold">Enterprise Security</h4>
                <p className="text-sm text-muted-foreground">SOC2, HIPAA compliance</p>
              </div>
              <div className="flex flex-col items-center">
                <Globe className="w-8 h-8 text-primary mb-2" />
                <h4 className="font-semibold">Global Infrastructure</h4>
                <p className="text-sm text-muted-foreground">Multi-region deployment</p>
              </div>
              <div className="flex flex-col items-center">
                <Users className="w-8 h-8 text-primary mb-2" />
                <h4 className="font-semibold">Dedicated Support</h4>
                <p className="text-sm text-muted-foreground">24/7 priority assistance</p>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="w-8 h-8 text-primary mb-2" />
                <h4 className="font-semibold">Custom Integrations</h4>
                <p className="text-sm text-muted-foreground">API development included</p>
              </div>
            </div>
            <Button size="lg">
              <Headphones className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>
          </CardContent>
        </Card>

        {/* Add-ons */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Powerful Add-ons</h2>
            <p className="text-xl text-muted-foreground">
              Extend your platform with premium features and services
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <addon.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{addon.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                  <div className="text-2xl font-bold text-primary mb-4">{addon.price}</div>
                  <Button variant="outline" size="sm" className="w-full">
                    Add to Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about HigherUp.ai pricing
            </p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h4 className="font-semibold mb-2">{faq.question}</h4>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using HigherUp.ai to automate, scale, and dominate their markets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg" className="h-12 px-8">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;