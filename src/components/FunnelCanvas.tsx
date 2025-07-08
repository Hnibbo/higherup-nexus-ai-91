import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Type, 
  Image, 
  Video, 
  Mail, 
  MousePointer, 
  Square,
  Grid,
  Save,
  Eye
} from "lucide-react";

interface FunnelCanvasProps {
  funnelName: string;
  setFunnelName: (name: string) => void;
  canvasElements: any[];
  setCanvasElements: (elements: any[]) => void;
  selectedElement: any;
  setSelectedElement: (element: any) => void;
}

const FunnelCanvas = ({
  funnelName,
  setFunnelName,
  canvasElements,
  setCanvasElements,
  selectedElement,
  setSelectedElement
}: FunnelCanvasProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const elements = [
    { type: "Text", icon: Type, description: "Add headings and paragraphs" },
    { type: "Button", icon: MousePointer, description: "Call-to-action buttons" },
    { type: "Image", icon: Image, description: "Add images and graphics" },
    { type: "Video", icon: Video, description: "Embed videos" },
    { type: "Form", icon: Mail, description: "Lead capture forms" },
    { type: "Container", icon: Square, description: "Layout containers" }
  ];

  const handleDragStart = (e: any, elementType: string) => {
    e.dataTransfer.setData("text/plain", elementType);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData("text/plain");
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
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
    
    setCanvasElements([...canvasElements, newElement]);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
  };

  const handleElementClick = (element: any) => {
    setSelectedElement(element);
  };

  const updateElementProperty = (elementId: string, property: string, value: any) => {
    setCanvasElements(canvasElements.map(el => 
      el.id === elementId ? { ...el, [property]: value } : el
    ));
  };

  const saveFunnel = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const funnelData = {
        name: funnelName,
        description: "Custom funnel created with HigherUp.ai",
        user_id: user.id,
        funnel_data: {
          elements: canvasElements,
          version: "1.0"
        },
        status: "draft"
      };

      const { error } = await supabase
        .from('funnels')
        .insert([funnelData]);

      if (error) throw error;

      toast({
        title: "Funnel saved!",
        description: "Your funnel has been successfully saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving funnel",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 border-r bg-card overflow-auto">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">DRAG TO ADD</h3>
            {elements.map(element => (
              <div
                key={element.type}
                draggable
                onDragStart={(e) => handleDragStart(e, element.type)}
                className="flex items-center space-x-3 p-3 border rounded-lg cursor-grab hover:bg-muted/50 transition-colors active:cursor-grabbing mb-2"
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

          {selectedElement && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">ELEMENT PROPERTIES</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs block mb-1">Content</label>
                  <Input 
                    value={selectedElement.content}
                    onChange={(e) => updateElementProperty(selectedElement.id, 'content', e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs block mb-1">Width</label>
                    <Input 
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateElementProperty(selectedElement.id, 'width', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1">Height</label>
                    <Input 
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateElementProperty(selectedElement.id, 'height', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs block mb-1">Background Color</label>
                  <Input 
                    type="color"
                    value={selectedElement.styles?.backgroundColor || "#ffffff"}
                    onChange={(e) => updateElementProperty(selectedElement.id, 'styles', {
                      ...selectedElement.styles,
                      backgroundColor: e.target.value
                    })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/20 p-8">
        <div className="flex justify-center">
          <div 
            className="bg-white rounded-lg shadow-xl min-h-[800px] relative transition-all duration-300 w-full max-w-4xl"
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
                  className={`absolute border-2 cursor-pointer transition-all hover:border-primary ${
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
  );
};

export default FunnelCanvas;