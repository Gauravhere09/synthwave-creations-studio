
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { generateImage, ImageGenerationParams, GeneratedImage as StabilityGeneratedImage } from '../services/stabilityService';
import PageTitle from '../components/PageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Input } from '../components/ui/input';
import { Download, Trash, X, Maximize, Share, Edit } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { SavedImage } from '../types/supabase';

interface GeneratedImage extends SavedImage {
  timestamp?: number;
}

const RESOLUTION_OPTIONS = [
  { label: '512 x 512', width: 512, height: 512 },
  { label: '640 x 640', width: 640, height: 640 },
  { label: '768 x 768', width: 768, height: 768 },
  { label: '1024 x 1024', width: 1024, height: 1024 }
];

const STYLE_OPTIONS = [
  { value: 'enhance', label: 'Enhance' },
  { value: 'anime', label: 'Anime' },
  { value: '3d-model', label: '3D Model' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'photographic', label: 'Photographic' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'low-poly', label: 'Low Poly' }
];

const ImageGenerator = () => {
  const [stabilityKey] = useLocalStorage<string>('stability-key', '');
  
  // Form state
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [resolution, setResolution] = useState<{ width: number; height: number }>(RESOLUTION_OPTIONS[3]);
  const [cfgScale, setCfgScale] = useState<number>(7);
  const [steps, setSteps] = useState<number>(30);
  const [style, setStyle] = useState<string>('enhance');
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingImages, setLoadingImages] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);
  const [viewImageId, setViewImageId] = useState<string | null>(null);
  
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoadingImages(true);
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setSavedImages(data as GeneratedImage[]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load saved images');
    } finally {
      setLoadingImages(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!stabilityKey) {
      toast.error('Please set your Stability AI API key in settings');
      return;
    }

    setLoading(true);
    try {
      const params: ImageGenerationParams = {
        prompt,
        negativePrompt,
        width: resolution.width as 512 | 640 | 768 | 1024,
        height: resolution.height as 512 | 640 | 768 | 1024,
        cfgScale,
        steps,
        style
      };
      
      const result = await generateImage(params, stabilityKey);
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.images && result.images.length > 0) {
        const generatedImage = result.images[0];
        
        // Convert to the format needed for our component
        const imageForComponent: GeneratedImage = {
          id: generatedImage.id,
          prompt: generatedImage.prompt,
          url: generatedImage.url,
          base64_image: generatedImage.base64Image,
          params: generatedImage.params,
          created_at: new Date().toISOString(),
        };
        
        setCurrentImage(imageForComponent);
        
        // Save to Supabase
        const { data, error } = await supabase
          .from('images')
          .insert([
            {
              prompt: generatedImage.prompt,
              url: generatedImage.url,
              base64_image: generatedImage.base64Image,
              params: generatedImage.params,
            }
          ])
          .select();
          
        if (error) {
          console.error('Error saving image to Supabase:', error);
        } else {
          fetchImages(); // Refresh images
        }
        
        toast.success('Image generated successfully');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setSavedImages(savedImages.filter(img => img.id !== id));
      if (currentImage?.id === id) {
        setCurrentImage(null);
      }
      if (viewImageId === id) {
        setViewImageId(null);
      }
      toast.success('Image deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const downloadImage = (image: GeneratedImage) => {
    const a = document.createElement('a');
    a.href = image.url;
    a.download = `ai-image-${image.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const viewImage = (id: string) => {
    setViewImageId(id);
  };

  const viewedImage = viewImageId ? savedImages.find(img => img.id === viewImageId) : null;

  return (
    <div className="transition-all hover:scale-[1.01]">
      <PageTitle 
        title="Image Generator" 
        description="Create images using Stability AI" 
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="transition-colors hover:bg-primary/20">Generate</TabsTrigger>
          <TabsTrigger value="gallery" className="transition-colors hover:bg-primary/20">Community Gallery</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="order-2 md:order-1 transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>Image Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea 
                      id="prompt"
                      placeholder="Enter your image description, e.g., 'A serene lake at sunset with mountains in the background'"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="transition-colors hover:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                    <Textarea 
                      id="negative-prompt"
                      placeholder="Things to avoid in the image, e.g., 'blurry, low quality'"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="transition-colors hover:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select 
                      value={`${resolution.width}x${resolution.height}`}
                      onValueChange={(value) => {
                        const [width, height] = value.split('x').map(Number);
                        setResolution({ width, height });
                      }}
                    >
                      <SelectTrigger className="transition-colors hover:border-primary">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.label} 
                            value={`${option.width}x${option.height}`}
                            className="transition-colors hover:bg-primary/20"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="style">Style</Label>
                    <Select 
                      value={style}
                      onValueChange={setStyle}
                    >
                      <SelectTrigger className="transition-colors hover:border-primary">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
                            className="transition-colors hover:bg-primary/20"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="cfg-scale">CFG Scale: {cfgScale}</Label>
                    </div>
                    <Slider 
                      id="cfg-scale"
                      min={1} 
                      max={30} 
                      step={1}
                      value={[cfgScale]}
                      onValueChange={(value) => setCfgScale(value[0])}
                      className="transition-colors hover:bg-primary/20"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="steps">Steps: {steps}</Label>
                    </div>
                    <Slider 
                      id="steps"
                      min={10} 
                      max={50} 
                      step={1}
                      value={[steps]}
                      onValueChange={(value) => setSteps(value[0])}
                      className="transition-colors hover:bg-primary/20"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fast</span>
                      <span>Quality</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading || !prompt.trim() || !stabilityKey}
                    className="w-full transition-colors hover:bg-primary/80"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Generating...</span>
                      </>
                    ) : (
                      'Generate Image'
                    )}
                  </Button>
                  
                  {!stabilityKey && (
                    <p className="text-sm text-destructive">
                      Please add your Stability AI API key in settings
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="order-1 md:order-2 transition-shadow hover:shadow-lg">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-muted/30">
                  {currentImage ? (
                    <img 
                      src={currentImage.url} 
                      alt={currentImage.prompt} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      Generate an image to see preview
                    </div>
                  )}
                </div>
              </CardContent>
              {currentImage && (
                <CardFooter className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => downloadImage(currentImage)}
                    className="transition-colors hover:bg-primary/20"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewImage(currentImage.id)}
                    className="transition-colors hover:bg-primary/20"
                  >
                    <Maximize className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="gallery" className="mt-4">
          {loadingImages ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : savedImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 p-2">
              {savedImages.map((image) => (
                <div key={image.id} className="relative group transition-transform hover:scale-105 rounded-xl overflow-hidden">
                  <div className="aspect-square bg-muted/30 rounded-xl overflow-hidden">
                    <img 
                      src={image.url} 
                      alt={image.prompt}
                      className="w-full h-full object-cover cursor-pointer" 
                      onClick={() => viewImage(image.id)}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                    <Button size="icon" variant="secondary" onClick={() => viewImage(image.id)} className="transition-colors hover:bg-primary/20">
                      <Maximize className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => downloadImage(image)} className="transition-colors hover:bg-primary/20">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteImage(image.id)} className="transition-colors hover:bg-destructive/80">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No saved images yet"
              description="Generate some images to populate the community gallery"
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Full screen image view dialog */}
      <Dialog open={!!viewImageId} onOpenChange={(open) => !open && setViewImageId(null)}>
        <DialogContent className="max-w-5xl w-full m-6 p-0 rounded-xl overflow-hidden bg-card/95 backdrop-blur-sm">
          {viewedImage && (
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full"
                onClick={() => setViewImageId(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div>
                <img 
                  src={viewedImage.url} 
                  alt={viewedImage.prompt} 
                  className="w-full h-auto"
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">Image Details</h3>
                <p className="text-sm text-muted-foreground mb-4">{viewedImage.prompt}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mt-2">
                  <div className="px-2 py-1 bg-secondary rounded">
                    <span className="block text-xs text-muted-foreground">Size</span>
                    <span className="font-medium">{viewedImage.params.width} x {viewedImage.params.height}</span>
                  </div>
                  <div className="px-2 py-1 bg-secondary rounded">
                    <span className="block text-xs text-muted-foreground">Style</span>
                    <span className="font-medium capitalize">{viewedImage.params.style || 'Default'}</span>
                  </div>
                  <div className="px-2 py-1 bg-secondary rounded">
                    <span className="block text-xs text-muted-foreground">CFG Scale</span>
                    <span className="font-medium">{viewedImage.params.cfgScale || 7}</span>
                  </div>
                  <div className="px-2 py-1 bg-secondary rounded">
                    <span className="block text-xs text-muted-foreground">Steps</span>
                    <span className="font-medium">{viewedImage.params.steps || 30}</span>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button onClick={() => downloadImage(viewedImage)} className="transition-colors hover:bg-primary/80">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    handleDeleteImage(viewedImage.id);
                  }} className="transition-colors hover:bg-destructive/80">
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGenerator;
