import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, User, Building, Chrome, Facebook, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, signInWithFacebook, user, loading } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords don't match",
            variant: "destructive",
          });
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Error", 
            description: "Password must be at least 6 characters long",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    try {
      const { error } = provider === 'google' 
        ? await signInWithGoogle()
        : await signInWithFacebook();
        
      if (error) {
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <div className="flex items-center space-x-3">
            <Link to="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="ghost">Marketplace</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold">
                Transform Your Business with AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                The all-in-one platform that's 1000× better than GoHighLevel. 
                Join thousands of businesses scaling with AI-powered marketing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center space-x-3 p-4 bg-card rounded-lg border">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">AI-Powered</p>
                  <p className="text-xs text-muted-foreground">Automated everything</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-card rounded-lg border">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">All-in-One</p>
                  <p className="text-xs text-muted-foreground">50+ tools included</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Badge variant="secondary">✓ 14-day free trial</Badge>
              <Badge variant="secondary">✓ No credit card required</Badge>
              <Badge variant="secondary">✓ Cancel anytime</Badge>
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription>
                  {isSignUp 
                    ? 'Join thousands using HigherUp.ai to dominate their markets'
                    : 'Sign in to your HigherUp.ai account'
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Social Auth Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth('google')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Chrome className="w-4 h-4 mr-2" />
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSocialAuth('facebook')}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Continue with Facebook
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with email
                    </span>
                  </div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-10 pr-10"
                        placeholder={isSignUp ? "Create a password (6+ characters)" : "Enter your password"}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder="Confirm your password"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {isSignUp && (
                    <div className="text-xs text-muted-foreground">
                      By creating an account, you agree to our{" "}
                      <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full group"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </form>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm"
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in'
                      : 'Need an account? Sign up'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;