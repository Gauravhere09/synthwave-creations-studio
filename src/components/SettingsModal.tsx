
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { useLocalStorage } from '../hooks/use-local-storage';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  // API keys
  const [geminiKey, setGeminiKey] = useLocalStorage('gemini-key', '');
  const [stabilityKey, setStabilityKey] = useLocalStorage('stability-key', '');
  const [elevenLabsKey, setElevenLabsKey] = useLocalStorage('eleven-labs-key', '');

  const handleSave = () => {
    toast.success('Settings saved successfully');
    onOpenChange(false);
  };

  const clearLocalStorage = () => {
    if (confirm("Are you sure you want to clear all local data? This will remove all saved scripts, images, audio, and API keys.")) {
      localStorage.clear();
      toast.success('All local data has been cleared');
      // Reset the state
      setGeminiKey('');
      setStabilityKey('');
      setElevenLabsKey('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] transition-shadow hover:shadow-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your API keys and preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="api-keys">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="api-keys" className="transition-colors hover:bg-primary/20">API Keys</TabsTrigger>
            <TabsTrigger value="data" className="transition-colors hover:bg-primary/20">Local Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-keys" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="Enter your Gemini API Key"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stability-key">Stability AI (DreamStudio) API Key</Label>
                <Input
                  id="stability-key"
                  type="password"
                  placeholder="Enter your DreamStudio API Key"
                  value={stabilityKey}
                  onChange={(e) => setStabilityKey(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="eleven-labs-key">ElevenLabs API Key</Label>
                <Input
                  id="eleven-labs-key"
                  type="password"
                  placeholder="Enter your ElevenLabs API Key"
                  value={elevenLabsKey}
                  onChange={(e) => setElevenLabsKey(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>
            </div>
            
            <Button onClick={handleSave} className="w-full transition-colors hover:bg-primary/80">
              Save Changes
            </Button>
          </TabsContent>
          
          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border">
                <h3 className="font-medium mb-1">Data Storage</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your generated content is now stored in Supabase and available for the community to see.
                  However, your API keys are still stored locally in your browser.
                  Clear this data if you want to remove all locally saved settings.
                </p>
                
                <Button 
                  variant="destructive" 
                  onClick={clearLocalStorage}
                  className="w-full transition-colors hover:bg-destructive/80"
                >
                  Clear Local Data
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
