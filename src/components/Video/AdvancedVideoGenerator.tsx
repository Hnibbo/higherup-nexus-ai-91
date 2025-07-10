import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Video,
  Camera,
  Mic,
  Settings,
  Play,
  Pause,
  Download,
  Share,
  Sparkles,
  Wand2,
  User,
  Palette,
  Music,
  Type,
  Image,
  Upload,
  Eye,
  Clock,
  Target,
  TrendingUp,
  Monitor,
  Smartphone,
  Tablet,
  Film,
  VolumeX,
  Volume2,
  RotateCcw,
  Save,
  Copy,
  Zap
} from 'lucide-react';

interface VideoProject {
  id: string;
  title: string;
  script: string;
  selectedAvatar: string;
  selectedTemplate: string;
  videoSettings: {
    quality: string;
    style: string;
    duration: number;
    background: string;
    music: string;
    voiceSettings: {
      speed: number;
      pitch: number;
      emotion: string;
    };
  };
  brandSettings: {
    logo: string;
    colors: string[];
    font: string;
  };
  status: 'draft' | 'processing' | 'completed' | 'failed';
  progress: number;
}

interface Avatar {
  id: string;
  name: string;
  gender: string;
  accent: string;
  style: string;
  thumbnail: string;
  voiceId: string;
  personalityTraits: {
    confidence: number;
    friendliness: number;
    professionalism: number;
  };
}

export const AdvancedVideoGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [currentProject, setCurrentProject] = useState<VideoProject>({
    id: '',
    title: '',
    script: '',
    selectedAvatar: '',
    selectedTemplate: '',
    videoSettings: {
      quality: '1080p',
      style: 'professional',
      duration: 60,
      background: 'office',
      music: 'corporate',
      voiceSettings: {
        speed: 1.0,
        pitch: 1.0,
        emotion: 'confident'
      }
    },
    brandSettings: {
      logo: '',
      colors: ['#8B5CF6', '#06B6D4'],
      font: 'Inter'
    },
    status: 'draft',
    progress: 0
  });

  const [availableAvatars, setAvailableAvatars] = useState<Avatar[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState('script');

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      const { data: avatars } = await supabase
        .from('ai_avatars')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false });

      if (avatars) {
        setAvailableAvatars(avatars.map(avatar => ({
          id: avatar.id,
          name: avatar.name,
          gender: avatar.gender || 'unknown',
          accent: avatar.accent || 'neutral',
          style: avatar.avatar_type,
          thumbnail: avatar.thumbnail_url || '/placeholder-avatar.jpg',
          voiceId: avatar.voice_id || '',
          personalityTraits: avatar.personality_traits as any || {
            confidence: 0.8,
            friendliness: 0.8,
            professionalism: 0.8
          }
        })));
      }
    } catch (error) {
      console.error('Error loading avatars:', error);
    }
  };

  const generateVideo = async () => {
    if (!user || !currentProject.script || !currentProject.selectedAvatar) {
      toast({
        title: "Missing Information",
        description: "Please provide script and select an avatar.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setCurrentProject(prev => ({ ...prev, status: 'processing', progress: 0 }));

    try {
      // Save project to database
      const projectData = {
        user_id: user.id,
        title: currentProject.title || 'Untitled Video',
        script_content: currentProject.script,
        avatar_id: currentProject.selectedAvatar,
        avatar_settings: {},
        video_settings: currentProject.videoSettings,
        generation_status: 'processing'
      };

      const { data: project, error } = await supabase
        .from('video_projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      // Simulate video generation with realistic progress
      const progressSteps = [
        { step: 'Analyzing script...', progress: 10 },
        { step: 'Preparing avatar...', progress: 25 },
        { step: 'Generating speech...', progress: 45 },
        { step: 'Creating visuals...', progress: 65 },
        { step: 'Adding effects...', progress: 80 },
        { step: 'Rendering video...', progress: 95 },
        { step: 'Finalizing...', progress: 100 }
      ];

      for (const { step, progress } of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCurrentProject(prev => ({ ...prev, progress }));
        
        toast({
          title: "Generation Progress",
          description: step,
        });
      }

      // Update project as completed
      await supabase
        .from('video_projects')
        .update({
          generation_status: 'completed',
          video_url: 'https://example.com/generated-video.mp4', // Would be actual video URL
          thumbnail_url: 'https://example.com/thumbnail.jpg'
        })
        .eq('id', project.id);

      setCurrentProject(prev => ({ ...prev, status: 'completed' }));

      toast({
        title: "Video Generated!",
        description: "Your professional marketing video is ready!",
      });

    } catch (error) {
      console.error('Error generating video:', error);
      setCurrentProject(prev => ({ ...prev, status: 'failed' }));
      toast({
        title: "Generation Failed",
        description: "There was an error generating your video.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveProject = async () => {
    if (!user) return;

    try {
      const projectData = {
        user_id: user.id,
        title: currentProject.title || 'Untitled Video',
        script_content: currentProject.script,
        avatar_id: currentProject.selectedAvatar,
        video_settings: currentProject.videoSettings,
        generation_status: 'draft'
      };

      await supabase
        .from('video_projects')
        .insert(projectData);

      toast({
        title: "Project Saved",
        description: "Your video project has been saved as draft."
      });
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const getPreviewSize = () => {
    switch (previewMode) {
      case 'mobile': return 'w-[320px] h-[568px]';
      case 'tablet': return 'w-[768px] h-[432px]';
      default: return 'w-full h-[400px]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold flex items-center">
            <Video className="w-8 h-8 mr-3 text-primary" />
            Advanced Video Generator
            <Badge className="ml-3" variant={isGenerating ? "default" : "secondary"}>
              {isGenerating ? "Generating..." : "Ready"}
            </Badge>
          </h2>
          <p className="text-muted-foreground">Create professional marketing videos with AI avatars and person cloning</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={saveProject}>
            <Save className="w-4 h-4 mr-2" />
            Save Project
          </Button>
          <Button onClick={generateVideo} disabled={isGenerating} className="bg-gradient-to-r from-primary to-purple-600">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Video
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Video Configuration</CardTitle>
              <CardDescription>Configure every aspect of your professional marketing video</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="script">Script</TabsTrigger>
                  <TabsTrigger value="avatar">Avatar</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="brand">Brand</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="script" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Video Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter your video title"
                      value={currentProject.title}
                      onChange={(e) => setCurrentProject(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="script">Video Script</Label>
                    <Textarea
                      id="script"
                      placeholder="Write your video script here. The AI avatar will speak these words with perfect lip sync..."
                      rows={8}
                      value={currentProject.script}
                      onChange={(e) => setCurrentProject(prev => ({ ...prev, script: e.target.value }))}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-muted-foreground">
                        {currentProject.script.length}/2000 characters
                      </p>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI Enhance
                        </Button>
                        <Button size="sm" variant="outline">
                          <Copy className="w-4 h-4 mr-2" />
                          Templates
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Estimated Duration</Label>
                      <p className="text-2xl font-bold text-primary">
                        {Math.ceil(currentProject.script.length / 150)} min
                      </p>
                    </div>
                    <div>
                      <Label>Reading Level</Label>
                      <Badge variant="outline">Professional</Badge>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="avatar" className="space-y-4">
                  <div>
                    <Label>Select AI Avatar</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {availableAvatars.map((avatar) => (
                        <Card 
                          key={avatar.id}
                          className={`cursor-pointer transition-all hover:scale-105 ${
                            currentProject.selectedAvatar === avatar.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setCurrentProject(prev => ({ ...prev, selectedAvatar: avatar.id }))}
                        >
                          <CardContent className="p-3">
                            <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                              <img 
                                src={avatar.thumbnail} 
                                alt={avatar.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <h4 className="font-medium">{avatar.name}</h4>
                            <p className="text-sm text-muted-foreground">{avatar.style}</p>
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="outline" className="text-xs">{avatar.accent}</Badge>
                              <Badge variant="outline" className="text-xs">{avatar.gender}</Badge>
                            </div>
                            
                            {/* Personality traits */}
                            <div className="mt-3 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Confidence</span>
                                <span>{(avatar.personalityTraits.confidence * 100).toFixed(0)}%</span>
                              </div>
                              <Progress value={avatar.personalityTraits.confidence * 100} className="h-1" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {currentProject.selectedAvatar && (
                    <Card className="p-4 bg-primary/5">
                      <h4 className="font-medium mb-2">Voice Settings</h4>
                      <div className="space-y-3">
                        <div>
                          <Label>Speech Speed</Label>
                          <Slider
                            value={[currentProject.videoSettings.voiceSettings.speed]}
                            onValueChange={([value]) => 
                              setCurrentProject(prev => ({
                                ...prev,
                                videoSettings: {
                                  ...prev.videoSettings,
                                  voiceSettings: { ...prev.videoSettings.voiceSettings, speed: value }
                                }
                              }))
                            }
                            min={0.5}
                            max={2.0}
                            step={0.1}
                            className="mt-2"
                          />
                          <p className="text-sm text-muted-foreground">
                            {currentProject.videoSettings.voiceSettings.speed}x speed
                          </p>
                        </div>

                        <div>
                          <Label>Emotion</Label>
                          <Select 
                            value={currentProject.videoSettings.voiceSettings.emotion}
                            onValueChange={(value) =>
                              setCurrentProject(prev => ({
                                ...prev,
                                videoSettings: {
                                  ...prev.videoSettings,
                                  voiceSettings: { ...prev.videoSettings.voiceSettings, emotion: value }
                                }
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="confident">Confident</SelectItem>
                              <SelectItem value="friendly">Friendly</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="excited">Excited</SelectItem>
                              <SelectItem value="calm">Calm</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Video Quality</Label>
                      <Select 
                        value={currentProject.videoSettings.quality}
                        onValueChange={(value) =>
                          setCurrentProject(prev => ({
                            ...prev,
                            videoSettings: { ...prev.videoSettings, quality: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">HD (720p)</SelectItem>
                          <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                          <SelectItem value="4k">4K Ultra HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Video Style</Label>
                      <Select 
                        value={currentProject.videoSettings.style}
                        onValueChange={(value) =>
                          setCurrentProject(prev => ({
                            ...prev,
                            videoSettings: { ...prev.videoSettings, style: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Background Setting</Label>
                    <Select 
                      value={currentProject.videoSettings.background}
                      onValueChange={(value) =>
                        setCurrentProject(prev => ({
                          ...prev,
                          videoSettings: { ...prev.videoSettings, background: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Modern Office</SelectItem>
                        <SelectItem value="studio">Professional Studio</SelectItem>
                        <SelectItem value="home">Home Office</SelectItem>
                        <SelectItem value="outdoor">Outdoor Setting</SelectItem>
                        <SelectItem value="custom">Custom Background</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Background Music</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['corporate', 'upbeat', 'calm', 'energetic', 'none'].map((music) => (
                        <Button
                          key={music}
                          variant={currentProject.videoSettings.music === music ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            setCurrentProject(prev => ({
                              ...prev,
                              videoSettings: { ...prev.videoSettings, music }
                            }))
                          }
                        >
                          <Music className="w-4 h-4 mr-2" />
                          {music.charAt(0).toUpperCase() + music.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="brand" className="space-y-4">
                  <div>
                    <Label>Company Logo</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload your logo (PNG, SVG recommended)</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Brand Colors</Label>
                    <div className="flex space-x-2 mt-2">
                      {currentProject.brandSettings.colors.map((color, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className="w-12 h-12 rounded-lg border-2 border-border cursor-pointer"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-xs mt-1">{color}</p>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="h-12 w-12">
                        <Palette className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Font Family</Label>
                    <Select 
                      value={currentProject.brandSettings.font}
                      onValueChange={(value) =>
                        setCurrentProject(prev => ({
                          ...prev,
                          brandSettings: { ...prev.brandSettings, font: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter (Modern)</SelectItem>
                        <SelectItem value="Roboto">Roboto (Clean)</SelectItem>
                        <SelectItem value="Poppins">Poppins (Friendly)</SelectItem>
                        <SelectItem value="Montserrat">Montserrat (Professional)</SelectItem>
                        <SelectItem value="Open Sans">Open Sans (Classic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Generated Captions</Label>
                        <p className="text-sm text-muted-foreground">Add subtitles automatically</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>AI Scene Optimization</Label>
                        <p className="text-sm text-muted-foreground">Let AI optimize scenes for engagement</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Smart Thumbnail Generation</Label>
                        <p className="text-sm text-muted-foreground">Generate multiple thumbnail options</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Multi-Platform Optimization</Label>
                        <p className="text-sm text-muted-foreground">Create versions for different platforms</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <div>
                    <Label>Custom Instructions</Label>
                    <Textarea
                      placeholder="Any specific instructions for the AI to follow during video generation..."
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Preview
                <div className="flex items-center space-x-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Tablet className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className={`${getPreviewSize()} bg-black rounded-lg overflow-hidden`}>
                  {currentProject.status === 'completed' ? (
                    <video 
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      controls
                      poster="/video-thumbnail.jpg"
                    >
                      <source src="/sample-video.mp4" type="video/mp4" />
                    </video>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      {isGenerating ? (
                        <div className="text-center">
                          <Zap className="w-12 h-12 mx-auto mb-4 animate-pulse" />
                          <p>Generating your video...</p>
                          <Progress value={currentProject.progress} className="mt-2" />
                        </div>
                      ) : (
                        <div className="text-center">
                          <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Video preview will appear here</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Video Info */}
              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs">Title</Label>
                  <p className="font-medium">{currentProject.title || 'Untitled Video'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs">Quality</Label>
                    <p>{currentProject.videoSettings.quality}</p>
                  </div>
                  <div>
                    <Label className="text-xs">Duration</Label>
                    <p>~{Math.ceil(currentProject.script.length / 150)} min</p>
                  </div>
                </div>

                {currentProject.selectedAvatar && (
                  <div>
                    <Label className="text-xs">Avatar</Label>
                    <p>{availableAvatars.find(a => a.id === currentProject.selectedAvatar)?.name}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generation Status */}
          {isGenerating && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Progress</span>
                    <span>{currentProject.progress}%</span>
                  </div>
                  <Progress value={currentProject.progress} />
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                      Script analyzed
                    </div>
                    <div className="flex items-center text-green-600">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                      Avatar prepared
                    </div>
                    <div className="flex items-center text-yellow-600">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mr-2 animate-pulse" />
                      Generating speech...
                    </div>
                    <div className="flex items-center text-gray-400">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
                      Creating visuals...
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};