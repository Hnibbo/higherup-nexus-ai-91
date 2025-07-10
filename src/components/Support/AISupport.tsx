import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Headphones,
  Zap,
  Search,
  BookOpen,
  Video,
  FileText,
  Settings,
  HelpCircle
} from 'lucide-react';

interface SupportMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  resolved?: boolean;
  rating?: number;
}

interface SupportConversation {
  id: string;
  messages: SupportMessage[];
  status: 'active' | 'resolved' | 'escalated';
  createdAt: Date;
  resolvedAt?: Date;
  satisfactionRating?: number;
}

const KNOWLEDGE_BASE = {
  'account_setup': {
    keywords: ['account', 'setup', 'profile', 'getting started', 'onboarding'],
    response: "I'll help you set up your account! Here's what you need to do:\n\n1. Complete your profile information\n2. Verify your email address\n3. Choose your subscription plan\n4. Import your contacts\n5. Set up your first campaign\n\nWould you like me to guide you through any specific step?"
  },
  'billing': {
    keywords: ['billing', 'payment', 'subscription', 'plan', 'upgrade', 'downgrade', 'cancel'],
    response: "I can help with billing questions! Here are the most common solutions:\n\n• View billing history in Settings > Billing\n• Update payment method in Settings > Payment\n• Upgrade/downgrade plan anytime\n• Cancel subscription with 30-day notice\n\nWhat specific billing question do you have?"
  },
  'email_campaigns': {
    keywords: ['email', 'campaign', 'send', 'delivery', 'open rate', 'click rate'],
    response: "Let me help you with email campaigns! Here's how to get the best results:\n\n✅ Use personalized subject lines\n✅ Segment your audience\n✅ A/B test your content\n✅ Schedule for optimal times\n✅ Monitor your analytics\n\nWhat specific email campaign issue are you facing?"
  },
  'funnels': {
    keywords: ['funnel', 'conversion', 'landing page', 'sales page', 'optimization'],
    response: "Funnel optimization is key to success! Here's how to improve conversions:\n\n🎯 Clear value proposition\n🎯 Compelling headlines\n🎯 Social proof elements\n🎯 Strong call-to-actions\n🎯 Mobile optimization\n\nCurrent average conversion rate is 12.3%. What funnel are you working on?"
  },
  'ai_features': {
    keywords: ['ai', 'artificial intelligence', 'automation', 'smart', 'generate'],
    response: "Our AI features are designed to 10x your marketing! Here's what you can do:\n\n🤖 Generate email content\n🤖 Optimize subject lines\n🤖 Create video scripts\n🤖 Analyze performance\n🤖 Automate workflows\n\nYou have 87 AI credits remaining. Which AI feature interests you most?"
  },
  'technical_issues': {
    keywords: ['error', 'bug', 'not working', 'broken', 'loading', 'slow'],
    response: "I'm sorry you're experiencing technical issues. Let's troubleshoot:\n\n1. Clear your browser cache\n2. Disable browser extensions\n3. Try incognito/private mode\n4. Check internet connection\n5. Update your browser\n\nIf issues persist, I'll escalate to our technical team. What specific error are you seeing?"
  }
};

export const AISupport = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversation, setConversation] = useState<SupportConversation>({
    id: `conv_${Date.now()}`,
    messages: [{
      id: '1',
      type: 'ai',
      content: "👋 Hi! I'm your AI support assistant. I'm here 24/7 to help you dominate your market with HigherUp.ai!\n\nI can help with:\n• Account setup & onboarding\n• Email campaigns & funnels\n• AI features & automation\n• Billing & subscriptions\n• Technical troubleshooting\n\nWhat can I help you with today?",
      timestamp: new Date(),
      intent: 'greeting',
      confidence: 1.0
    }],
    status: 'active',
    createdAt: new Date()
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages]);

  const detectIntent = (message: string): { intent: string; confidence: number } => {
    const lowercaseMessage = message.toLowerCase();
    
    for (const [intent, config] of Object.entries(KNOWLEDGE_BASE)) {
      for (const keyword of config.keywords) {
        if (lowercaseMessage.includes(keyword)) {
          const confidence = keyword.length / message.length; // Simple confidence scoring
          return { intent, confidence: Math.min(confidence * 2, 1) };
        }
      }
    }
    
    return { intent: 'general', confidence: 0.5 };
  };

  const generateAIResponse = (userMessage: string, detectedIntent: string): string => {
    const config = KNOWLEDGE_BASE[detectedIntent as keyof typeof KNOWLEDGE_BASE];
    
    if (config) {
      return config.response;
    }
    
    // Fallback responses for general queries
    const fallbackResponses = [
      "I understand you need help with that. Let me connect you with the right information or escalate to a human specialist if needed.",
      "That's a great question! While I search for the best answer, you can also check our knowledge base or video tutorials.",
      "I want to make sure I give you the most accurate information. Let me analyze your question and provide the best solution.",
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return;

    const userMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message
    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInputMessage('');
    setIsTyping(true);

    try {
      // Detect intent
      const { intent, confidence } = detectIntent(userMessage.content);
      
      // Generate AI response
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI thinking
      
      const aiResponse: SupportMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'ai',
        content: generateAIResponse(userMessage.content, intent),
        timestamp: new Date(),
        intent,
        confidence
      };

      // Add AI response
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, aiResponse]
      }));

      // Save to database
      await supabase
        .from('ai_support_conversations')
        .insert([
          {
            user_id: user.id,
            conversation_id: conversation.id,
            message_type: 'user',
            message_content: userMessage.content,
            intent_detected: intent,
            confidence_score: confidence
          },
          {
            user_id: user.id,
            conversation_id: conversation.id,
            message_type: 'ai',
            message_content: aiResponse.content,
            intent_detected: intent,
            confidence_score: confidence
          }
        ]);

    } catch (error) {
      console.error('Error in AI support:', error);
      toast({
        title: "Support Error",
        description: "There was an issue with the AI support. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleRating = async (messageId: string, rating: number) => {
    setConversation(prev => ({
      ...prev,
      messages: prev.messages.map(msg => 
        msg.id === messageId ? { ...msg, rating } : msg
      )
    }));

    if (user) {
      try {
        await supabase
          .from('ai_support_conversations')
          .update({ satisfaction_rating: rating })
          .eq('user_id', user.id)
          .eq('conversation_id', conversation.id);
      } catch (error) {
        console.error('Error saving rating:', error);
      }
    }

    toast({
      title: "Thank you!",
      description: "Your feedback helps us improve our AI support."
    });
  };

  const escalateToHuman = async () => {
    const escalationMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      type: 'system',
      content: "🧑‍💻 Connecting you to a human specialist... Average wait time: 2 minutes.\n\nWhile you wait, you can browse our knowledge base or video tutorials below.",
      timestamp: new Date()
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, escalationMessage],
      status: 'escalated'
    }));

    if (user) {
      try {
        await supabase
          .from('ai_support_conversations')
          .insert({
            user_id: user.id,
            conversation_id: conversation.id,
            message_type: 'system',
            message_content: escalationMessage.content,
            escalated_to_human: true
          });
      } catch (error) {
        console.error('Error escalating:', error);
      }
    }
  };

  const startVoiceRecognition = () => {
    setIsListening(true);
    // Voice recognition implementation would go here
    setTimeout(() => {
      setIsListening(false);
      setInputMessage("How do I set up my first email campaign?");
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-end p-4 z-50">
      <Card className="w-96 h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
                  🤖
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">AI Support</CardTitle>
                <CardDescription className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Online 24/7
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={escalateToHuman}>
                <User className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex space-x-2 max-w-[80%] ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <Avatar className="flex-shrink-0">
                  <AvatarFallback className={
                    message.type === 'user' 
                      ? "bg-secondary" 
                      : message.type === 'system'
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gradient-to-br from-primary to-purple-600 text-primary-foreground"
                  }>
                    {message.type === 'user' ? '👤' : message.type === 'system' ? '⚙️' : '🤖'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? "bg-primary text-primary-foreground"
                      : message.type === 'system'
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    
                    {message.type === 'ai' && !message.rating && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRating(message.id, 1)}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRating(message.id, 0)}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    
                    {message.rating !== undefined && (
                      <Badge variant={message.rating === 1 ? "default" : "secondary"}>
                        {message.rating === 1 ? 'Helpful' : 'Not helpful'}
                      </Badge>
                    )}
                  </div>
                  
                  {message.intent && message.confidence && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Intent: {message.intent} ({Math.round(message.confidence * 100)}% confidence)
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="flex space-x-2">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-primary-foreground">
                    🤖
                  </AvatarFallback>
                </Avatar>
                <div className="p-3 rounded-lg bg-muted">
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

        {/* Quick Actions */}
        <div className="p-2 border-t">
          <div className="grid grid-cols-3 gap-1">
            <Button variant="outline" size="sm" className="text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              Docs
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Video className="w-3 h-3 mr-1" />
              Videos
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Search className="w-3 h-3 mr-1" />
              Search
            </Button>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                placeholder="Type your question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="pr-10"
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
            <Button onClick={handleSendMessage} disabled={!inputMessage.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};