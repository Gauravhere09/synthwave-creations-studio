
import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { generateScript } from '../services/geminiService';
import PageTitle from '../components/PageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../hooks/use-toast';
import EmptyState from '../components/EmptyState';

interface SavedScript {
  id: string;
  title: string;
  prompt: string;
  content: string;
  createdAt: number;
}

const ScriptGenerator = () => {
  const [geminiKey] = useLocalStorage<string>('gemini-key', '');
  const [prompt, setPrompt] = useState<string>('');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [savedScripts, setSavedScripts] = useLocalStorage<SavedScript[]>('saved-scripts', []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (!geminiKey) {
      toast.error('Please set your Gemini API key in settings');
      return;
    }

    setLoading(true);
    try {
      const result = await generateScript(prompt, geminiKey);
      if (result.error) {
        toast.error(result.error);
      } else {
        setGeneratedScript(result.content);
      }
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error('Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScript = () => {
    if (!generatedScript.trim()) {
      toast.error('No script to save');
      return;
    }

    const scriptTitle = prompt.split(' ').slice(0, 5).join(' ') + '...';
    
    const newScript: SavedScript = {
      id: `script_${Date.now()}`,
      title: scriptTitle,
      prompt,
      content: generatedScript,
      createdAt: Date.now(),
    };

    setSavedScripts([newScript, ...savedScripts]);
    toast.success('Script saved successfully');
  };

  const handleDeleteScript = (id: string) => {
    setSavedScripts(savedScripts.filter(script => script.id !== id));
    toast.success('Script deleted');
  };

  const handleLoadScript = (script: SavedScript) => {
    setPrompt(script.prompt);
    setGeneratedScript(script.content);
  };

  return (
    <div>
      <PageTitle 
        title="Script Generator" 
        description="Create scripts using Gemini AI" 
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="saved">Saved Scripts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Script Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">What would you like to create?</Label>
                  <Textarea 
                    id="prompt"
                    placeholder="Enter your script idea, e.g., 'Create a movie script about a detective who can talk to plants'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !prompt.trim() || !geminiKey}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    'Generate Script'
                  )}
                </Button>
                
                {!geminiKey && (
                  <p className="text-sm text-destructive">
                    Please add your Gemini API key in settings
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {generatedScript && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Script</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSaveScript}
                >
                  Save Script
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-md overflow-y-auto max-h-96 text-left whitespace-pre-wrap">
                  {generatedScript}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="mt-4">
          {savedScripts.length > 0 ? (
            <div className="space-y-4">
              {savedScripts.map((script) => (
                <Card key={script.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{script.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleLoadScript(script)}
                        >
                          Load
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteScript(script.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(script.createdAt).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {script.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No saved scripts yet"
              description="Generate and save scripts to see them here"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScriptGenerator;
