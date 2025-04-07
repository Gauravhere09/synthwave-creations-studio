
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { generateScript } from '../services/geminiService';
import PageTitle from '../components/PageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { supabase } from '../integrations/supabase/client';

interface SavedScript {
  id: string;
  title: string;
  prompt: string;
  content: string;
  created_at: string | number;
}

const ScriptGenerator = () => {
  const [geminiKey] = useLocalStorage<string>('gemini-key', '');
  const [prompt, setPrompt] = useState<string>('');
  const [generatedScript, setGeneratedScript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingScripts, setLoadingScripts] = useState<boolean>(false);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);

  // Fetch scripts from Supabase on component mount
  useEffect(() => {
    fetchScripts();
  }, []);

  const fetchScripts = async () => {
    setLoadingScripts(true);
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setSavedScripts(data);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast.error('Failed to load saved scripts');
    } finally {
      setLoadingScripts(false);
    }
  };

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

  const handleSaveScript = async () => {
    if (!generatedScript.trim()) {
      toast.error('No script to save');
      return;
    }

    const scriptTitle = prompt.split(' ').slice(0, 5).join(' ') + '...';
    
    try {
      const { data, error } = await supabase
        .from('scripts')
        .insert([
          {
            title: scriptTitle,
            prompt: prompt,
            content: generatedScript,
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      toast.success('Script saved successfully');
      fetchScripts(); // Refresh the scripts list
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error('Failed to save script');
    }
  };

  const handleDeleteScript = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setSavedScripts(savedScripts.filter(script => script.id !== id));
      toast.success('Script deleted');
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error('Failed to delete script');
    }
  };

  const handleLoadScript = (script: SavedScript) => {
    setPrompt(script.prompt);
    setGeneratedScript(script.content);
  };

  return (
    <div className="transition-all hover:scale-[1.01]">
      <PageTitle 
        title="Script Generator" 
        description="Create scripts using Gemini AI" 
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="transition-colors hover:bg-primary/20">Generate</TabsTrigger>
          <TabsTrigger value="saved" className="transition-colors hover:bg-primary/20">Community Scripts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4 mt-4">
          <Card className="transition-shadow hover:shadow-lg">
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
                    className="min-h-32 transition-colors hover:border-primary"
                  />
                </div>
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !prompt.trim() || !geminiKey}
                  className="w-full transition-colors hover:bg-primary/80"
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
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Script</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSaveScript}
                  className="transition-colors hover:bg-primary/20"
                >
                  Share Script
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
          {loadingScripts ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : savedScripts.length > 0 ? (
            <div className="space-y-4">
              {savedScripts.map((script) => (
                <Card key={script.id} className="transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">{script.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleLoadScript(script)}
                          className="transition-colors hover:bg-primary/20"
                        >
                          Load
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteScript(script.id)}
                          className="transition-colors hover:bg-destructive/80"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(script.created_at).toLocaleDateString()}
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
              description="Generate and share scripts to see them here"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScriptGenerator;
