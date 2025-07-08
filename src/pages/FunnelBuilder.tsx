import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Layers, 
  MousePointer, 
  Type, 
  Image, 
  Video, 
  Mail, 
  Phone,
  CreditCard,
  Settings,
  Eye,
  Save,
  Undo,
  Redo,
  Palette,
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  Zap,
  Plus,
  Grid,
  Square
} from "lucide-react";

// Import real images
import funnelProductLaunch from "@/assets/funnel-product-launch.jpg";
import funnelLeadMagnet from "@/assets/funnel-lead-magnet.jpg";
import funnelWebinar from "@/assets/funnel-webinar.jpg";
import funnelCourse from "@/assets/funnel-course.jpg";

const FunnelBuilder = () => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [canvasElements, setCanvasElements] = useState([]);
  const [activeTab, setActiveTab] = useState("templates");
  const [viewMode, setViewMode] = useState("desktop");
  const [funnelName, setFunnelName] = useState("Untitled Funnel");
  const canvasRef = useRef(null);

  const templates = [
    {
      id: 1,
      name: "Product Launch",
      category: "Sales",
      image: funnelProductLaunch,
      conversions: "12.5%",
      description: "High-converting product launch sequence"
    },
    {
      id: 2,
      name: "Lead Magnet",
      category: "Lead Gen",
      image: funnelLeadMagnet,
      conversions: "18.3%",
      description: "Capture leads with irresistible offers"
    },
    {
      id: 3,
      name: "Webinar Signup",
      category: "Events",
      image: funnelWebinar,
      conversions: "15.7%",
      description: "Drive webinar registrations"
    },
    {
      id: 4,
      name: "Course Sales",
      category: "Education",
      image: funnelCourse,
      conversions: "22.1%",
      description: "Sell online courses effectively"
    }
  ];

  const elements = [
    { type: "Text", icon: Type, description: "Add headings and paragraphs" },
    { type: "Button", icon: MousePointer, description: "Call-to-action buttons" },
    { type: "Image", icon: Image, description: "Add images and graphics" },
    { type: "Video", icon: Video, description: "Embed videos" },
    { type: "Form", icon: Mail, description: "Lead capture forms" },
    { type: "Container", icon: Square, description: "Layout containers" }
  ];

  const handleDragStart = (e, elementType) => {
    e.dataTransfer.setData("text/plain", elementType);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData("text/plain");
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newElement = {
      id: Date.now().toString(),
      type: elementType,
      x,
      y,
      width: 200,
      height: 50,
      content: `New ${elementType}`,
      styles: {
        backgroundColor: elementType === "Button" ? "hsl(var(--primary))" : "transparent",
        color: elementType === "Button" ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
        fontSize: "16px",
        padding: "12px"
      }
    };
    
    setCanvasElements(prev => [...prev, newElement]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
  };

  const updateElementProperty = (elementId, property, value) => {
    setCanvasElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, [property]: value } : el
    ));
  };

  const getViewportSize = () => {
    switch (viewMode) {
      case "mobile": return { width: "375px", maxWidth: "375px" };
      case "tablet": return { width: "768px", maxWidth: "768px" };
      default: return { width: "100%", maxWidth: "1200px" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <Input 
              value={funnelName}
              onChange={(e) => setFunnelName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none shadow-none px-0 focus-visible:ring-0"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button variant="outline" size="sm">
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
            <div className="flex border rounded-lg p-1 bg-muted/50">
              <Button
                variant={viewMode === "desktop" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("desktop")}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "tablet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("tablet")}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "mobile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("mobile")}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button size="sm" className="animate-pulse-glow">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-card overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 m-4">
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
            </TabsList>

            <TabsContent value="templates" className="p-4 space-y-4">
              <div className="space-y-3">
                {templates.map(template => (
                  <Card key={template.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 animate-fade-in">
                    <CardContent className="p-3">
                      <div className="aspect-video rounded-lg overflow-hidden mb-3">
                        <img 
                          src={template.image} 
                          alt={template.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{template.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {template.conversions}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                          <Button size="sm" className="h-7">
                            <Plus className="w-3 h-3 mr-1" />
                            Use
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="elements" className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground mb-3">DRAG TO ADD</h3>
                {elements.map(element => (
                  <div
                    key={element.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, element.type)}
                    className="flex items-center space-x-3 p-3 border rounded-lg cursor-grab hover:bg-muted/50 transition-colors active:cursor-grabbing animate-fade-in"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <element.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{element.type}</div>
                      <div className="text-xs text-muted-foreground">{element.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="design" className="p-4 space-y-4">
              {selectedElement ? (
                <div className="space-y-4 animate-scale-in">
                  <h3 className="font-medium text-sm text-muted-foreground">ELEMENT PROPERTIES</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Content</Label>
                      <Input 
                        value={selectedElement.content}
                        onChange={(e) => updateElementProperty(selectedElement.id, 'content', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Input 
                          type="number"
                          value={selectedElement.width}
                          onChange={(e) => updateElementProperty(selectedElement.id, 'width', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <Input 
                          type="number"
                          value={selectedElement.height}
                          onChange={(e) => updateElementProperty(selectedElement.id, 'height', parseInt(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Background Color</Label>
                      <Input 
                        type="color"
                        value={selectedElement.styles?.backgroundColor || "#ffffff"}
                        onChange={(e) => updateElementProperty(selectedElement.id, 'styles', {
                          ...selectedElement.styles,
                          backgroundColor: e.target.value
                        })}
                        className="mt-1 h-10"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select an element to customize its design</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-muted/20 p-8">
          <div className="flex justify-center">
            <div 
              className="bg-white rounded-lg shadow-xl min-h-[800px] relative transition-all duration-300"
              style={getViewportSize()}
              ref={canvasRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {canvasElements.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Grid className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">Drop elements here to build your funnel</p>
                    <p className="text-sm">Drag elements from the sidebar to get started</p>
                  </div>
                </div>
              ) : (
                canvasElements.map(element => (
                  <div
                    key={element.id}
                    className={`absolute border-2 cursor-pointer transition-all hover:border-primary animate-scale-in ${
                      selectedElement?.id === element.id ? 'border-primary' : 'border-transparent hover:border-muted'
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      ...element.styles
                    }}
                    onClick={() => handleElementClick(element)}
                  >
                    <div className="w-full h-full flex items-center justify-center text-sm">
                      {element.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunnelBuilder;