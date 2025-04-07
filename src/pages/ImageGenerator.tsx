import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { Download, Trash, Maximize } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PageTitle from '../components/PageTitle';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { SavedImage } from '../types/supabase';
import { X } from 'lucide-react';

interface GenerationParams {
  prompt: string;
  width: number;
  height: number;
  samples: number;
  cfgScale: number;
  steps: number;
}

const ImageGenerator = () => {
  const [stabilityKey] = useLocalStorage<string>('stability-key', '');
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [base64Image, setBase64Image] = useState<string>('');
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [loadingSavedImages, setLoadingSavedImages] = useState<boolean>(false);
  const [viewImageId, setViewImageId] = useState<string | null>(null);
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    width: 512,
    height: 512,
    samples: 1,
    cfgScale: 7,
    steps: 30,
  });

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoadingSavedImages(true);
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setSavedImages(data as SavedImage[]);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load saved images');
    } finally {
      setLoadingSavedImages(false);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!stabilityKey) {
      toast.error('Please set your Stability AI API key in settings');
      return;
    }

    setLoadingImage(true);
    setImageUrl('');
    setBase64Image('');

    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${stabilityKey}`,
        },
        body: JSON.stringify({
          ...params,
          prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      if (data.artifacts && data.artifacts.length > 0) {
        const image = data.artifacts[0];
        const imageUrl = `data:image/png;base64,${image.base64}`;
        setImageUrl(imageUrl);
        setBase64Image(image.base64);
        setParams({ ...params, prompt }); // Update prompt in params
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image generated');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image: ' + error.message);
    } finally {
      setLoadingImage(false);
    }
  };

  const saveImage = async () => {
    if (!imageUrl || !base64Image) {
      toast.error('No image to save');
      return;
    }

    try {
      const { error } = await supabase
        .from('images')
        .insert({
          prompt: prompt,
          url: imageUrl,
          base64_image: base64Image,
          params: params,
        });

      if (error) {
        throw error;
      }

      fetchImages();
      toast.success('Image saved successfully!');
    } catch (error) {
      console.error('Error saving image:', error);
      toast.error('Failed to save image');
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

      setSavedImages(savedImages.filter(image => image.id !== id));
      if (viewImageId === id) {
        setViewImageId(null);
      }
      toast.success('Image deleted');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const viewImage = (id: string) => {
    setViewImageId(id);
  };

  const viewedImage = viewImageId ? savedImages.find(image => image.id === viewImageId) : null;

  return (
    <div>
      <PageTitle
        title="Image Generator"
        description="Generate images using Stability AI"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Image Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Input
                  id="prompt"
                  placeholder="Enter a prompt for the image"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>

              <Button
                onClick={generateImage}
                disabled={loadingImage || !prompt.trim() || !stabilityKey}
                className="w-full transition-colors hover:bg-primary/80"
              >
                {loadingImage ? (
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

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Image Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {imageUrl ? (
              <img src={imageUrl} alt={prompt} className="w-full rounded-md" />
            ) : (
              <div className="text-muted-foreground text-sm p-8 flex items-center justify-center">
                Generate an image to see preview
              </div>
            )}
          </CardContent>
          {imageUrl && (
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveImage}
                className="transition-colors hover:bg-primary/20"
              >
                Save Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadImage(imageUrl, `${prompt.slice(0, 20)}.png`)}
                className="transition-colors hover:bg-primary/20"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Saved Images</h2>
        {loadingSavedImages ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : savedImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {savedImages.map((image) => (
              <Card key={image.id} className="relative group transition-transform hover:scale-105 rounded-xl overflow-hidden">
                <CardHeader>
                  <CardTitle>{image.prompt}</CardTitle>
                </CardHeader>
                <CardContent>
                  <img src={image.url} alt={image.prompt} className="w-full rounded-md" />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button size="sm" variant="secondary" onClick={() => viewImage(image.id)} className="transition-colors hover:bg-primary/20">
                    <Maximize className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <div className="flex gap-2">
                    <Button size="icon" variant="secondary" onClick={() => downloadImage(image.url, `${image.prompt.slice(0, 20)}.png`)} className="transition-colors hover:bg-primary/20">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteImage(image.id)} className="transition-colors hover:bg-destructive/80">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No saved images yet"
            description="Generate and save images to populate your collection"
          />
        )}
      </div>

      {/* Full screen image view dialog */}
      <Dialog open={!!viewImageId} onOpenChange={(open) => !open && setViewImageId(null)}>
        <DialogContent className="max-w-5xl w-full m-6 p-6 rounded-xl overflow-hidden bg-card/95 backdrop-blur-sm">
          <DialogTitle>Image Details</DialogTitle>
          <DialogDescription>View and manage your generated image</DialogDescription>
          
          {viewedImage && (
            <div className="relative mt-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full"
                onClick={() => setViewImageId(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="my-4 p-4 flex flex-col items-center">
                <div className="relative w-full max-h-[70vh] overflow-hidden rounded-lg shadow-lg">
                  <img 
                    src={viewedImage.url} 
                    alt={viewedImage.prompt} 
                    className="w-full h-auto object-contain p-2 bg-muted/20" 
                  />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Prompt</h3>
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">{viewedImage.prompt}</p>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button onClick={() => downloadImage(viewedImage.url, `${viewedImage.prompt.slice(0, 20)}.png`)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteImage(viewedImage.id)}>
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGenerator;
