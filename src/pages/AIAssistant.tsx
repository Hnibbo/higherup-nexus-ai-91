import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Code
} from "lucide-react";

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "assistant",
      content: "👋 Hi there! I'm your AI assistant. I can help you build campaigns, create content, analyze data, and optimize your marketing. What would you like to work on today?",
      timestamp: new Date(),
      avatar: "🤖"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

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
      avatar: "👤"
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
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
      avatar: "🤖"
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">AI Assistant</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost">
              <RefreshCw className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Personality Selector */}
            <Card>
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

            {/* Quick Actions */}
            <Card>
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

            {/* Recent Tasks */}
            <Card>
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
          </div>

          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-12rem)]">
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
              <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 h-[calc(100vh-20rem)]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex space-x-3 max-w-3xl ${
                        message.type === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <Avatar className="flex-shrink-0">
                        <AvatarFallback className={
                          message.type === "user" 
                            ? "bg-secondary" 
                            : "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground"
                        }>
                          {message.type === "user" ? "👤" : message.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`p-4 rounded-lg ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                          🤖
                        </AvatarFallback>
                      </Avatar>
                      <div className="p-4 rounded-lg bg-muted">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                {/* Suggestions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {suggestion}
                    </Button>
                  ))}
                </div>

                {/* Input Field */}
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Ask me anything... I can help you build campaigns, analyze data, create content, and more!"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startVoiceRecognition}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                        isListening ? "text-red-500" : ""
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button onClick={handleSendMessage} disabled={!inputMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-2 text-center">
                  AI can make mistakes. Verify important information and review generated content.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;