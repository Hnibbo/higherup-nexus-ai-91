import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Wand2 } from "lucide-react";

interface EmailCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: any;
  onSuccess: () => void;
}

const EmailCampaignForm = ({ open, onOpenChange, campaign, onSuccess }: EmailCampaignFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: campaign?.name || "",
    subject: campaign?.subject || "",
    content: campaign?.content || "",
    status: campaign?.status || "draft",
    scheduled_at: campaign?.scheduled_at ? new Date(campaign.scheduled_at) : null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      const campaignData = {
        ...formData,
        user_id: user.id,
        scheduled_at: formData.scheduled_at?.toISOString() || null
      };

      if (campaign?.id) {
        // Update existing campaign
        const { error } = await supabase
          .from('email_campaigns')
          .update(campaignData)
          .eq('id', campaign.id);
        
        if (error) throw error;
        
        toast({
          title: "Campaign updated",
          description: "Email campaign has been successfully updated.",
        });
      } else {
        // Create new campaign
        const { error } = await supabase
          .from('email_campaigns')
          .insert([campaignData]);
        
        if (error) throw error;
        
        toast({
          title: "Campaign created",
          description: "New email campaign has been created.",
        });
      }
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAIContent = async () => {
    setAiGenerating(true);
    
    // Simulate AI content generation
    setTimeout(() => {
      const aiSubjects = [
        "🚀 Transform Your Business Today - Limited Time Offer",
        "💡 The Secret to 10x Growth (Most People Miss This)",
        "⚡ Your Competitors Don't Want You to See This",
        "🎯 Double Your Revenue in 30 Days - Proven Method"
      ];
      
      const aiContent = `Hi {{first_name}},

I hope this email finds you well! I wanted to reach out because I have something exciting to share with you.

Our latest solution has been helping businesses like yours achieve incredible results:
• 300% increase in conversion rates
• 50% reduction in customer acquisition costs  
• 24/7 automated lead generation

What makes this different? It's powered by AI and designed specifically for ambitious entrepreneurs who refuse to settle for average results.

I'd love to show you exactly how this works. Would you be interested in a quick 15-minute demo this week?

Just hit reply and let me know what works best for you.

Best regards,
{{sender_name}}

P.S. This offer is only available for the next 72 hours, so don't wait too long!`;

      setFormData(prev => ({
        ...prev,
        subject: aiSubjects[Math.floor(Math.random() * aiSubjects.length)],
        content: aiContent
      }));
      
      setAiGenerating(false);
      
      toast({
        title: "AI Content Generated",
        description: "Your email campaign content has been generated using AI optimization.",
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? "Edit Campaign" : "Create Email Campaign"}
          </DialogTitle>
          <DialogDescription>
            {campaign ? "Update your email campaign" : "Create a new email campaign"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="subject">Email Subject *</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={generateAIContent}
                disabled={aiGenerating}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {aiGenerating ? "Generating..." : "AI Generate"}
              </Button>
            </div>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Email Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={12}
              required
              placeholder="Write your email content here... You can use {{first_name}}, {{last_name}}, {{company}} for personalization."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Schedule Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduled_at ? format(formData.scheduled_at, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.scheduled_at}
                    onSelect={(date) => setFormData(prev => ({ ...prev, scheduled_at: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || aiGenerating} className="flex-1">
              {loading ? "Saving..." : campaign ? "Update Campaign" : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailCampaignForm;