import { useState, useRef, useEffect, Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import AppLayout from "@/components/AppLayout";
import { InteractiveAICanvas } from "@/components/AI/InteractiveAICanvas";
import { Scene3D } from "@/components/Three/Scene3D";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  MessageSquare, 
  Zap,
  Settings,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  BarChart3,
  Lightbulb,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Calendar,
  Database,
  Palette,
  Code,
  Layers
} from "lucide-react";

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content: "👋 Hi there! I'm your AI assistant. I can help you build campaigns, create content, analyze data, and optimize your marketing. What would you like to work on today?",
      timestamp: new Date(),
      avatar: "🤖",
      isAnimated: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [canvasMode, setCanvasMode] = useState("assistant");
  const [taskProgress, setTaskProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const canvasRef = useRef(null);

  const suggestions = [
    "Create an email campaign for our summer sale",
    "Analyze my funnel conversion rates",
    "Write social media posts for this week",
    "Generate a landing page for our new product",
    "Optimize my email subject lines",
    "Create a lead magnet for B2B clients"
  ];

  const capabilities = [
    {
      icon: Mail,
      title: "Email Campaigns",
      description: "Create, optimize, and schedule email campaigns",
      action: "Build Email Campaign"
    },
    {
      icon: Target,
      title: "Funnel Builder",
      description: "Design high-converting sales funnels",
      action: "Create Funnel"
    },
    {
      icon: FileText,
      title: "Content Creation",
      description: "Generate blog posts, ads, and social content",
      action: "Generate Content"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Analyze performance and get optimization tips",
      action: "View Analytics"
    },
    {
      icon: Database,
      title: "CRM Management",
      description: "Manage contacts and track interactions",
      action: "Manage CRM"
    },
    {
      icon: Calendar,
      title: "Automation Setup",
      description: "Create workflow automations",
      action: "Setup Automation"
    }
  ];

  const recentTasks = [
    {
      id: 1,
      task: "Created 'Summer Sale' email campaign",
      status: "completed",
      timestamp: "2 hours ago",
      result: "Campaign sent to 12,547 subscribers"
    },
    {
      id: 2,
      task: "Optimized landing page copy",
      status: "completed",
      timestamp: "1 day ago",
      result: "Conversion rate improved by 23%"
    },
    {
      id: 3,
      task: "Generated social media content",
      status: "completed",
      timestamp: "2 days ago",
      result: "Created 10 posts for this week"
    },
    {
      id: 4,
      task: "Analyzing funnel performance",
      status: "in-progress",
      timestamp: "3 hours ago",
      result: "Analysis 78% complete"
    }
  ];

  const aiPersonalities = [
    { id: "advisor", name: "Business Advisor", icon: "👔", description: "Strategic guidance and recommendations" },
    { id: "creative", name: "Creative Director", icon: "🎨", description: "Content creation and design ideas" },
    { id: "analyst", name: "Data Analyst", icon: "📊", description: "Performance analysis and insights" },
    { id: "coach", name: "Growth Coach", icon: "🚀", description: "Motivation and growth strategies" }
  ];

  const [selectedPersonality, setSelectedPersonality] = useState("advisor");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      avatar: "👤",
      isAnimated: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      // Save interaction to database
      if (user) {
        await supabase.from('ai_interactions').insert([
          {
            user_id: user.id,
            interaction_type: 'chat',
            prompt: inputMessage,
            interaction_context: { personality: selectedPersonality }
          }
        ]);
      }

      // Real AI processing simulation with progress
      setCurrentTask("Processing your request...");
      setTaskProgress(0);
      
      const progressInterval = setInterval(() => {
        setTaskProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 150);

      setTimeout(() => {
        const aiResponse = generateAIResponse(inputMessage);
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
        setCurrentTask("");
        setTaskProgress(0);
        toast.success("AI task completed successfully!");
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast.error("Failed to process your request. Please try again.");
    }
  };

  const generateAIResponse = (userInput) => {
    const responses = {
      "email campaign": "I'll help you create an email campaign! 📧 Let me suggest a structure:\n\n✅ Catchy subject line\n✅ Personalized greeting\n✅ Clear value proposition\n✅ Strong call-to-action\n✅ Mobile-optimized design\n\nWould you like me to create a draft for your summer sale campaign?",
      "funnel": "Great choice! 🎯 I can help you build a high-converting funnel. Here's what I recommend:\n\n📍 Landing page with compelling headline\n📍 Lead magnet to capture emails\n📍 Email sequence to nurture leads\n📍 Sales page with social proof\n📍 Thank you page with upsell\n\nWhat's your main goal for this funnel?",
      "analytics": "Let me analyze your current performance! 📊\n\n🔍 I'm seeing some great opportunities:\n• Email open rates: 42.3% (industry avg: 21.3%)\n• Funnel conversion: 12.5% (can optimize to 15%+)\n• Top traffic source: Organic search (68%)\n\nWould you like specific recommendations to improve these metrics?",
      "default": "I understand you're looking for help! 🤖 I can assist with:\n\n✨ Creating marketing campaigns\n✨ Building sales funnels\n✨ Writing content\n✨ Analyzing performance\n✨ Automating workflows\n✨ Managing your CRM\n\nWhat specific task would you like to tackle first?"
    };

    const content = Object.keys(responses).find(key => 
      userInput.toLowerCase().includes(key)
    ) || "default";

    return {
      id: messages.length + 2,
      type: "assistant",
      content: responses[content],
      timestamp: new Date(),
      avatar: "🤖",
      isAnimated: true
    };
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const startVoiceRecognition = () => {
    setIsListening(true);
    // Voice recognition would be implemented here
    setTimeout(() => {
      setIsListening(false);
      setInputMessage("Create an email campaign for our summer sale");
    }, 2000);
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
    // Text-to-speech would be implemented here
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
        {/* 3D Background Scene */}
        <div className="fixed inset-0 pointer-events-none opacity-30 z-0">
          <Suspense fallback={null}>
            <Scene3D interactive={false} />
          </Suspense>
        </div>
        
        {/* Header */}
        <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <Zap className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <span className="text-lg font-semibold hidden sm:block">AI Assistant</span>
            </div>
            
            {/* Mobile Menu */}
            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => setCanvasMode(canvasMode === "assistant" ? "canvas" : "assistant")}
                  className="hover-lift"
                >
                  <Layers className="w-4 h-4 mr-2" />
                  {canvasMode === "assistant" ? "AI Canvas" : "Chat Mode"}
                </Button>
                <Button variant="ghost" className="hover-lift">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setMessages([messages[0]]);
                    toast.success("Started new conversation");
                  }}
                  className="hover-lift"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
              
              {/* Mobile Sheet Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Settings className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="space-y-4 mt-8">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setCanvasMode(canvasMode === "assistant" ? "canvas" : "assistant");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      {canvasMode === "assistant" ? "AI Canvas" : "Chat Mode"}
                    </Button>
                    <Button variant="ghost" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => {
                        setMessages([messages[0]]);
                        setIsMobileMenuOpen(false);
                        toast.success("Started new conversation");
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          
          {/* Progress Bar */}
          <AnimatePresence>
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{currentTask}</span>
                    <span>{taskProgress}%</span>
                  </div>
                  <Progress value={taskProgress} className="h-1" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Dynamic Content Based on Mode */}
        <AnimatePresence mode="wait">
          {canvasMode === "canvas" ? (
            <motion.div 
              key="canvas"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="container mx-auto px-4 py-8 relative z-10"
            >
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="w-5 h-5 text-primary" />
                    <span>Interactive AI Canvas</span>
                  </CardTitle>
                  <CardDescription>
                    Visual workspace for AI-powered content creation and collaboration
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[600px] relative">
                    <InteractiveAICanvas />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="container mx-auto px-4 py-4 sm:py-8 relative z-10"
            >
              <div className="grid lg:grid-cols-4 gap-4 lg:gap-6">
                {/* Mobile-First Sidebar */}
                <div className="lg:space-y-6 space-y-4 order-2 lg:order-1">
                  {/* AI Personality Selector */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className="glass hover-glow">
                      <CardHeader>
                        <CardTitle className="text-lg">AI Personality</CardTitle>
                        <CardDescription>Choose your assistant's expertise</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {aiPersonalities.map((personality) => (
                          <div
                            key={personality.id}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedPersonality === personality.id
                                ? "bg-primary/10 border border-primary/20"
                                : "hover:bg-muted/50"
                            }`}
                            onClick={() => setSelectedPersonality(personality.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{personality.icon}</span>
                              <div>
                                <h4 className="font-medium text-sm">{personality.name}</h4>
                                <p className="text-xs text-muted-foreground">{personality.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Card className="glass hover-glow">
                      <CardHeader>
                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                        <CardDescription>Common tasks I can help with</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {capabilities.slice(0, 4).map((capability, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="w-full justify-start h-auto p-3"
                            onClick={() => handleSuggestionClick(capability.action)}
                          >
                            <capability.icon className="w-4 h-4 mr-3 text-primary" />
                            <div className="text-left">
                              <div className="font-medium text-sm">{capability.title}</div>
                              <div className="text-xs text-muted-foreground">{capability.description}</div>
                            </div>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Recent Tasks */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <Card className="glass hover-glow">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Tasks</CardTitle>
                        <CardDescription>What I've helped you with lately</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {recentTasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="p-3 border rounded-lg">
                            <div className="flex items-start space-x-2">
                              {task.status === "completed" ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-600 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{task.task}</p>
                                <p className="text-xs text-muted-foreground">{task.timestamp}</p>
                                <p className="text-xs text-green-600 mt-1">{task.result}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Main Chat Interface - Mobile First */}
                <div className="lg:col-span-3 order-1 lg:order-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <Card className="h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)] glass hover-glow">
                      <CardHeader className="border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                                🤖
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg">HigherUp AI Assistant</CardTitle>
                              <CardDescription>
                                {aiPersonalities.find(p => p.id === selectedPersonality)?.name} mode
                                <Badge className="ml-2" variant="secondary">Online</Badge>
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={toggleSpeech}
                              className={isSpeaking ? "text-primary" : ""}
                            >
                              {isSpeaking ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {/* Chat Messages */}
                      <ScrollArea className="flex-1 h-[calc(100vh-16rem)] sm:h-[calc(100vh-20rem)]">
                        <CardContent className="p-4 sm:p-6 space-y-4">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`flex space-x-2 sm:space-x-3 max-w-[85%] sm:max-w-3xl ${
                                  message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                                }`}
                              >
                                <Avatar className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                                  <AvatarFallback className={
                                    message.type === "user" 
                                      ? "bg-secondary text-xs sm:text-sm" 
                                      : "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs sm:text-sm"
                                  }>
                                    {message.type === "user" ? "👤" : message.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  className={`p-3 sm:p-4 rounded-lg shadow-sm ${
                                    message.type === "user"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted/80 backdrop-blur-sm"
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap text-sm sm:text-base">{message.content}</p>
                                  <p className={`text-xs mt-2 ${
                                    message.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}>
                                    {message.timestamp.toLocaleTimeString()}
                                  </p>
                                </motion.div>
                              </div>
                            </motion.div>
                          ))}

                          <AnimatePresence>
                            {isTyping && (
                              <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex justify-start"
                              >
                                <div className="flex space-x-2 sm:space-x-3">
                                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xs sm:text-sm">
                                      🤖
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="p-3 sm:p-4 rounded-lg bg-muted/80 backdrop-blur-sm">
                                    <div className="flex space-x-1">
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div ref={messagesEndRef} />
                        </CardContent>
                      </ScrollArea>

                      {/* Input Area */}
                      <div className="border-t p-3 sm:p-4 space-y-3 sm:space-y-4">
                        {/* Quick Suggestions - Mobile Optimized */}
                        <div className="flex flex-wrap gap-2">
                          {suggestions.slice(0, 3).map((suggestion, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs hover-lift backdrop-blur-sm"
                              >
                                <Sparkles className="w-3 h-3 mr-1" />
                                <span className="truncate max-w-[120px] sm:max-w-none">
                                  {suggestion}
                                </span>
                              </Button>
                            </motion.div>
                          ))}
                        </div>

                        {/* Input Field - Mobile Optimized */}
                        <div className="flex space-x-2">
                          <div className="flex-1 relative">
                            <Textarea
                              placeholder="Ask me anything... I can help you build campaigns, analyze data, create content, and more!"
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                              className="min-h-[44px] resize-none pr-12 sm:pr-16 backdrop-blur-sm"
                              rows={1}
                            />
                            <div className="absolute right-2 bottom-2 flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={startVoiceRecognition}
                                className={`p-1 h-8 w-8 rounded ${
                                  isListening ? "text-red-500 bg-red-50" : "text-muted-foreground hover:bg-muted"
                                }`}
                              >
                                {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                              </Button>
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              onClick={handleSendMessage} 
                              disabled={!inputMessage.trim() || isTyping}
                              className="h-[44px] px-4 sm:px-6 gradient-bg hover:shadow-lg"
                            >
                              <Send className="w-4 h-4" />
                              <span className="hidden sm:inline ml-2">Send</span>
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default AIAssistant;