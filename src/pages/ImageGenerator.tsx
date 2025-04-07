
import React, { useState } from 'react';
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
import { generateImage, GeneratedImage, ImageGenerationParams } from '../services/stabilityService';
import PageTitle from '../components/PageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Input } from '../components/ui/input';
import { Download, Trash, X, Maximize, Share, Edit } from 'lucide-react';

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
  const [savedImages, setSavedImages] = useLocalStorage<GeneratedImage[]>('saved-images', []);
  
  // Form state
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [resolution, setResolution] = useState<{ width: number; height: number }>(RESOLUTION_OPTIONS[3]);
  const [cfgScale, setCfgScale] = useState<number>(7);
  const [steps, setSteps] = useState<number>(30);
  const [style, setStyle] = useState<string>('enhance');
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [viewImageId, setViewImageId] = useState<string | null>(null);
  
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
        setCurrentImage(result.images[0]);
        setSavedImages([...result.images, ...savedImages]);
        toast.success('Image generated successfully');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = (id: string) => {
    setSavedImages(savedImages.filter(img => img.id !== id));
    if (currentImage?.id === id) {
      setCurrentImage(null);
    }
    if (viewImageId === id) {
      setViewImageId(null);
    }
    toast.success('Image deleted');
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
    <div>
      <PageTitle 
        title="Image Generator" 
        description="Create images using DreamStudio AI" 
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="order-2 md:order-1">
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
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                    <Textarea 
                      id="negative-prompt"
                      placeholder="Things to avoid in the image, e.g., 'blurry, low quality'"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.label} 
                            value={`${option.width}x${option.height}`}
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value}
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
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fast</span>
                      <span>Quality</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading || !prompt.trim() || !stabilityKey}
                    className="w-full"
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
                      Please add your DreamStudio API key in settings
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="order-1 md:order-2">
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
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => viewImage(currentImage.id)}
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
          {savedImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {savedImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square bg-muted/30 rounded-lg overflow-hidden">
                    <img 
                      src={image.url} 
                      alt={image.prompt}
                      className="w-full h-full object-cover cursor-pointer" 
                      onClick={() => viewImage(image.id)}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                    <Button size="icon" variant="secondary" onClick={() => viewImage(image.id)}>
                      <Maximize className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => downloadImage(image)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteImage(image.id)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No saved images yet"
              description="Generate some images to populate your gallery"
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Full screen image view dialog */}
      <Dialog open={!!viewImageId} onOpenChange={(open) => !open && setViewImageId(null)}>
        <DialogContent className="max-w-5xl w-full">
          {viewedImage && (
            <>
              <DialogHeader>
                <DialogTitle>Image Details</DialogTitle>
                <DialogDescription className="line-clamp-2">
                  {viewedImage.prompt}
                </DialogDescription>
              </DialogHeader>
              
              <div className="relative">
                <img 
                  src={viewedImage.url} 
                  alt={viewedImage.prompt} 
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
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
              
              <div className="flex justify-end gap-2 mt-2">
                <Button onClick={() => downloadImage(viewedImage)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="destructive" onClick={() => {
                  handleDeleteImage(viewedImage.id);
                }}>
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGenerator;
