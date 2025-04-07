import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import PageTitle from '../components/PageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Trash, Edit } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Script } from '../types/supabase';

const ScriptGenerator = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [title, setTitle] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingScripts, setLoadingScripts] = useState<boolean>(false);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);

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
        setScripts(data as Script[]);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
      toast.error('Failed to load scripts');
    } finally {
      setLoadingScripts(false);
    }
  };

  const clearForm = () => {
    setTitle('');
    setPrompt('');
    setContent('');
    setEditingScriptId(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      // Simulate generating content (replace with actual AI generation)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setContent(`Generated content based on prompt: ${prompt}`);
      toast.success('Script generated!');
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error('Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const saveScript = async (script: { title: string; prompt: string; content: string }) => {
    try {
      const { error } = await supabase
        .from('scripts')
        .insert({
          title: script.title,
          prompt: script.prompt,
          content: script.content
        });
      
      if (error) {
        throw error;
      }
      
      fetchScripts();
      toast.success('Script saved successfully!');
    } catch (error) {
      console.error('Error saving script:', error);
      toast.error('Failed to save script');
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !prompt.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingScriptId) {
      handleUpdate();
      return;
    }

    await saveScript({ title, prompt, content });
    clearForm();
  };

  const handleEdit = (script: Script) => {
    setEditingScriptId(script.id);
    setTitle(script.title);
    setPrompt(script.prompt);
    setContent(script.content);
  };

  const handleUpdate = async () => {
    if (!editingScriptId) return;

    try {
      const { error } = await supabase
        .from('scripts')
        .update({
          title: title,
          prompt: prompt,
          content: content
        })
        .eq('id', editingScriptId);
      
      if (error) {
        throw error;
      }
      
      fetchScripts();
      toast.success('Script updated successfully!');
    } catch (error) {
      console.error('Error updating script:', error);
      toast.error('Failed to update script');
    } finally {
      clearForm();
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      fetchScripts();
      toast.success('Script deleted successfully!');
    } catch (error) {
      console.error('Error deleting script:', error);
      toast.error('Failed to delete script');
    }
  };

  return (
    <div>
      <PageTitle 
        title="AI Script Generator" 
        description="Generate scripts for videos, ads, and more" 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="order-2 md:order-1 transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>{editingScriptId ? 'Edit Script' : 'Create Script'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Textarea 
                  id="title"
                  placeholder="Enter script title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea 
                  id="prompt"
                  placeholder="Enter your script description, e.g., 'A promotional video script for a new coffee shop'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea 
                  id="content"
                  placeholder="Generated script content will appear here"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate} 
                  disabled={loading || !prompt.trim()}
                  className="w-1/2 transition-colors hover:bg-primary/80"
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
                
                <Button 
                  onClick={handleSave} 
                  disabled={!title.trim() || !prompt.trim() || !content.trim()}
                  className="w-1/2 transition-colors hover:bg-primary/80"
                >
                  {editingScriptId ? 'Update Script' : 'Save Script'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 md:order-2 transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Saved Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingScripts ? (
              <div className="flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : scripts.length > 0 ? (
              <div className="space-y-4">
                {scripts.map((script) => (
                  <div key={script.id} className="p-4 rounded-md border">
                    <h3 className="text-lg font-semibold">{script.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{script.prompt}</p>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(script)}
                        className="transition-colors hover:bg-primary/20"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(script.id)}
                        className="transition-colors hover:bg-destructive/20"
                      >
                        <Trash className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No scripts saved yet"
                description="Generate and save scripts to see them here"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScriptGenerator;
