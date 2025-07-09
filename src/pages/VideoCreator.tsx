import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import videoAvatar1 from "@/assets/video-avatar-1.jpg";
import videoAvatar2 from "@/assets/video-avatar-2.jpg";
import videoAvatar3 from "@/assets/video-avatar-3.jpg";
import avatarProfessional1 from "@/assets/avatar-professional-1.jpg";
import videoTemplate from "@/assets/video-template.jpg";
import { 
  Video, 
  Upload, 
  User, 
  Mic, 
  Image, 
  Play, 
  Pause, 
  Download,
  Share,
  Settings,
  Wand2,
  Camera,
  FileVideo,
  Palette,
  Type,
  Music,
  Zap,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  Send,
  Save,
  RotateCcw
} from "lucide-react";

const VideoCreator = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [videoScript, setVideoScript] = useState("");
  const [videoTitle, setVideoTitle] = useState("");

  const avatars = [
    {
      id: 1,
      name: "Sarah",
      type: "Professional",
      thumbnail: videoAvatar2,
      accent: "American",
      gender: "Female"
    },
    {
      id: 2,
      name: "David",
      type: "Casual",
      thumbnail: videoAvatar3,
      accent: "British",
      gender: "Male"
    },
    {
      id: 3,
      name: "Maria",
      type: "Corporate",
      thumbnail: avatarProfessional1,
      accent: "Spanish",
      gender: "Female"
    },
    {
      id: 4,
      name: "James",
      type: "Friendly",
      thumbnail: videoAvatar1,
      accent: "Australian",
      gender: "Male"
    }
  ];

  const templates = [
    {
      id: 1,
      name: "Product Demo",
      category: "Marketing",
      duration: "1-2 min",
      thumbnail: videoTemplate,
      description: "Showcase your product features"
    },
    {
      id: 2,
      name: "Explainer Video",
      category: "Educational",
      duration: "2-3 min",
      thumbnail: videoTemplate,
      description: "Explain complex concepts simply"
    },
    {
      id: 3,
      name: "Social Media Ad",
      category: "Advertising",
      duration: "15-30s",
      thumbnail: videoTemplate,
      description: "Engaging social media content"
    },
    {
      id: 4,
      name: "Testimonial",
      category: "Social Proof",
      duration: "1 min",
      thumbnail: videoTemplate,
      description: "Customer success stories"
    }
  ];

  const [recentVideos] = useState([
    {
      id: 1,
      title: "Product Launch Video",
      thumbnail: videoTemplate,
      duration: "2:34",
      status: "completed",
      views: 1247,
      likes: 89,
      createdAt: "2 hours ago"
    },
    {
      id: 2,
      title: "Welcome Message",
      thumbnail: videoTemplate,
      duration: "1:12",
      status: "processing",
      views: 0,
      likes: 0,
      createdAt: "1 day ago"
    },
    {
      id: 3,
      title: "Tutorial Series Intro",
      thumbnail: videoTemplate,
      duration: "0:45",
      status: "completed",
      views: 2156,
      likes: 178,
      createdAt: "3 days ago"
    }
  ]);

  const generateVideo = () => {
    if (!selectedAvatar || !videoScript || !videoTitle) {
      alert("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate video generation progress
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsGenerating(false);
          alert("Video generated successfully!");
          return 100;
        }
        return prev + 10;
      });
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Video className="w-8 h-8 mr-3 text-primary" />
            Video Creator
          </h1>
          <p className="text-muted-foreground">Create professional videos with AI-powered avatars and templates</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
          <Button>
            <Camera className="w-4 h-4 mr-2" />
            Record Video
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileVideo className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Total Videos</span>
            </div>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Total Views</span>
            </div>
            <div className="text-2xl font-bold">12.4k</div>
            <p className="text-xs text-muted-foreground">+847 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Watch Time</span>
            </div>
            <div className="text-2xl font-bold">48.2h</div>
            <p className="text-xs text-muted-foreground">+12.3h this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium ml-2">Engagement</span>
            </div>
            <div className="text-2xl font-bold">8.7%</div>
            <p className="text-xs text-muted-foreground">+1.2% this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Video</TabsTrigger>
          <TabsTrigger value="avatars">AI Avatars</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="library">Video Library</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Creation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Video</CardTitle>
                <CardDescription>Generate professional videos with AI avatars</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="videoTitle">Video Title</Label>
                  <Input 
                    id="videoTitle"
                    placeholder="Enter your video title"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="videoScript">Video Script</Label>
                  <Textarea 
                    id="videoScript"
                    placeholder="Write your video script here. The AI avatar will speak these words..."
                    rows={6}
                    value={videoScript}
                    onChange={(e) => setVideoScript(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {videoScript.length}/2000 characters
                  </p>
                </div>

                <div>
                  <Label>Select Avatar</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {avatars.map((avatar) => (
                      <Card 
                        key={avatar.id} 
                        className={`cursor-pointer transition-all ${
                          selectedAvatar?.id === avatar.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedAvatar(avatar)}
                      >
                        <CardContent className="p-3">
                          <div className="aspect-square bg-muted rounded-lg mb-2 overflow-hidden">
                            <img 
                              src={avatar.thumbnail} 
                              alt={avatar.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <h4 className="font-medium text-sm">{avatar.name}</h4>
                          <p className="text-xs text-muted-foreground">{avatar.type}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Video Style</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Video Quality</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hd">HD (720p)</SelectItem>
                        <SelectItem value="fhd">Full HD (1080p)</SelectItem>
                        <SelectItem value="4k">4K (2160p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Background Music</span>
                    <Button variant="outline" size="sm">
                      <Music className="w-4 h-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                  
                  <div>
                    <Label>Music Volume</Label>
                    <Slider defaultValue={[30]} max={100} step={1} className="mt-2" />
                  </div>
                </div>

                {isGenerating && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Generating video...</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} />
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    onClick={generateVideo} 
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>See how your video will look</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                  {selectedAvatar ? (
                    <div className="text-center">
                      <img 
                        src={selectedAvatar.thumbnail} 
                        alt={selectedAvatar.name}
                        className="w-24 h-24 rounded-full mx-auto mb-2"
                      />
                      <p className="text-sm font-medium">{selectedAvatar.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedAvatar.type} • {selectedAvatar.accent}</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Video className="w-16 h-16 mx-auto mb-2" />
                      <p>Select an avatar to preview</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Video Title</Label>
                    <p className="text-sm font-medium">{videoTitle || "Untitled Video"}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs">Script Preview</Label>
                    <p className="text-sm text-muted-foreground">
                      {videoScript ? videoScript.substring(0, 100) + (videoScript.length > 100 ? "..." : "") : "No script entered"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Estimated duration: ~{Math.ceil(videoScript.length / 150)} min</span>
                    <span>Quality: HD</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="avatars" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Avatar Gallery</CardTitle>
              <CardDescription>Choose from our collection of realistic AI avatars</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {avatars.map((avatar) => (
                  <Card key={avatar.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={avatar.thumbnail} 
                          alt={avatar.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-semibold mb-1">{avatar.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{avatar.type}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span>Accent: {avatar.accent}</span>
                        <Badge variant="outline">{avatar.gender}</Badge>
                      </div>
                      <Button className="w-full mt-3" size="sm">
                        <User className="w-4 h-4 mr-2" />
                        Select Avatar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video Templates</CardTitle>
              <CardDescription>Start with professionally designed templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                        <img 
                          src={template.thumbnail} 
                          alt={template.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-semibold mb-1">{template.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex justify-between items-center text-xs mb-3">
                        <Badge variant="outline">{template.category}</Badge>
                        <span>{template.duration}</span>
                      </div>
                      <Button className="w-full" size="sm">
                        <Palette className="w-4 h-4 mr-2" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Video Library</CardTitle>
                  <CardDescription>Manage your created videos</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    New Video
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVideos.map((video) => (
                  <div key={video.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="aspect-video w-32 bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{video.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <span>{video.duration}</span>
                          <span>{video.createdAt}</span>
                          <Badge variant={video.status === 'completed' ? 'default' : 'secondary'}>
                            {video.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {video.views}
                          </span>
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {video.likes}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share className="w-4 h-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Video Settings</DialogTitle>
                              <DialogDescription>Manage your video settings and options</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Video Title</Label>
                                <Input defaultValue={video.title} />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea placeholder="Add a description for your video..." />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Cancel</Button>
                                <Button>Save Changes</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoCreator;