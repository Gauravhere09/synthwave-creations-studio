
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { supabase } from '../integrations/supabase/client';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import PageTitle from '../components/PageTitle';
import { Download, Trash, X, Maximize, Share, Edit } from 'lucide-react';
import { synthesizeSpeech, getVoices, Voice } from '../services/elevenlabsService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { SavedAudio } from '../types/supabase';

const VoiceGenerator = () => {
  const [elevenLabsKey, setElevenLabsKey] = useLocalStorage<string>('eleven-labs-key', '');
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [voiceId, setVoiceId] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [savedAudioFiles, setSavedAudioFiles] = useState<SavedAudio[]>([]);
  const [loadingVoices, setLoadingVoices] = useState<boolean>(false);
  const [loadingAudio, setLoadingAudio] = useState<boolean>(false);
  const [loadingSavedAudio, setLoadingSavedAudio] = useState<boolean>(false);
  const [viewAudioId, setViewAudioId] = useState<string | null>(null);

  // Check for API key on load and also any time it changes
  useEffect(() => {
    console.log("ElevenLabs key from storage:", elevenLabsKey ? "exists" : "not found");
    if (elevenLabsKey) {
      fetchVoices();
    }
    fetchAudioFiles();
  }, [elevenLabsKey]);

  const fetchVoices = async () => {
    if (!elevenLabsKey) {
      console.log("No API key available for fetching voices");
      return;
    }
    
    setLoadingVoices(true);
    try {
      console.log("Fetching voices...");
      const fetchedVoices = await getVoices(elevenLabsKey);
      console.log("Fetched voices:", fetchedVoices);
      setVoices(fetchedVoices);
      if (fetchedVoices.length > 0) {
        setVoiceId(fetchedVoices[0].voice_id);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error('Failed to fetch voices. Please check your API key.');
    } finally {
      setLoadingVoices(false);
    }
  };

  const fetchAudioFiles = async () => {
    setLoadingSavedAudio(true);
    try {
      const { data, error } = await supabase
        .from('audio')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setSavedAudioFiles(data as SavedAudio[]);
      }
    } catch (error) {
      console.error('Error fetching audio files:', error);
      toast.error('Failed to load saved audio files');
    } finally {
      setLoadingSavedAudio(false);
    }
  };

  const generateAudio = async () => {
    if (!text.trim()) {
      toast.error('Please enter text to synthesize');
      return;
    }

    if (!elevenLabsKey) {
      toast.error('Please set your ElevenLabs API key in settings');
      return;
    }

    if (!voiceId) {
      toast.error('Please select a voice');
      return;
    }

    setLoadingAudio(true);
    try {
      const { audioUrl } = await synthesizeSpeech(elevenLabsKey, text, voiceId);
      setAudioUrl(audioUrl);
      toast.success('Audio generated successfully!');
    } catch (error) {
      console.error('Error synthesizing speech:', error);
      toast.error('Failed to generate audio');
    } finally {
      setLoadingAudio(false);
    }
  };

  const saveAudio = async (audioData: { 
    title: string;
    text: string; 
    url: string;
    voice_id: string;
  }) => {
    try {
      const { error } = await supabase
        .from('audio')
        .insert({
          title: audioData.title,
          text: audioData.text,
          url: audioData.url,
          voice_id: audioData.voice_id
        });
      
      if (error) {
        throw error;
      }
      
      fetchAudioFiles();
      toast.success('Audio saved successfully!');
    } catch (error) {
      console.error('Error saving audio:', error);
      toast.error('Failed to save audio');
    }
  };

  const handleDeleteAudio = async (id: string) => {
    try {
      const { error } = await supabase
        .from('audio')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSavedAudioFiles(savedAudioFiles.filter(audio => audio.id !== id));
      if (viewAudioId === id) {
        setViewAudioId(null);
      }
      toast.success('Audio deleted');
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error('Failed to delete audio');
    }
  };

  const downloadAudio = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const viewAudio = (id: string) => {
    setViewAudioId(id);
  };

  const viewedAudio = viewAudioId ? savedAudioFiles.find(audio => audio.id === viewAudioId) : null;

  return (
    <div>
      <PageTitle
        title="Voice Generator"
        description="Generate realistic voices using ElevenLabs"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Audio Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a title for your audio"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Text</Label>
                <Textarea
                  id="text"
                  placeholder="Enter the text you want to convert to speech"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="transition-colors hover:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice">Voice</Label>
                <Select value={voiceId} onValueChange={setVoiceId} disabled={loadingVoices || voices.length === 0}>
                  <SelectTrigger className="transition-colors hover:border-primary">
                    <SelectValue placeholder={voices.length > 0 ? "Select a voice" : "No voices available"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {voices.map((voice) => (
                      <SelectItem key={voice.voice_id} value={voice.voice_id} className="transition-colors hover:bg-primary/20">
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingVoices && <LoadingSpinner size="sm" />}
              </div>

              <Button
                onClick={fetchVoices}
                variant="outline"
                disabled={!elevenLabsKey}
                className="w-full transition-colors hover:bg-primary/20"
              >
                {loadingVoices ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Loading voices...</span>
                  </>
                ) : (
                  'Refresh Voices'
                )}
              </Button>

              <Button
                onClick={generateAudio}
                disabled={loadingAudio || !text.trim() || !elevenLabsKey || !voiceId}
                className="w-full transition-colors hover:bg-primary/80"
              >
                {loadingAudio ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating...</span>
                  </>
                ) : (
                  'Generate Audio'
                )}
              </Button>

              {!elevenLabsKey && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  Please add your ElevenLabs API key in settings. Check that you've saved after entering the key.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle>Audio Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {audioUrl ? (
              <audio controls className="w-full">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            ) : (
              <div className="text-muted-foreground text-sm p-8 flex items-center justify-center">
                Generate audio to see preview
              </div>
            )}
          </CardContent>
          {audioUrl && (
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveAudio({ title, text, url: audioUrl, voice_id: voiceId })}
                className="transition-colors hover:bg-primary/20"
              >
                Save Audio
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadAudio(audioUrl, `${title || 'audio'}.mp3`)}
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
        <h2 className="text-2xl font-semibold mb-4">Saved Audio Files</h2>
        {loadingSavedAudio ? (
          <div className="flex justify-center p-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : savedAudioFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {savedAudioFiles.map((audio) => (
              <Card key={audio.id} className="relative group transition-transform hover:scale-105 rounded-xl overflow-hidden">
                <CardHeader>
                  <CardTitle>{audio.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio controls className="w-full">
                    <source src={audio.url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <Button size="sm" variant="secondary" onClick={() => viewAudio(audio.id)} className="transition-colors hover:bg-primary/20">
                    <Maximize className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <div className="flex gap-2">
                    <Button size="icon" variant="secondary" onClick={() => downloadAudio(audio.url, `${audio.title}.mp3`)} className="transition-colors hover:bg-primary/20">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDeleteAudio(audio.id)} className="transition-colors hover:bg-destructive/80">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No saved audio files yet"
            description="Generate and save audio files to populate your collection"
          />
        )}
      </div>

      {/* Full screen audio view dialog - updated with proper padding */}
      <Dialog open={!!viewAudioId} onOpenChange={(open) => !open && setViewAudioId(null)}>
        <DialogContent className="max-w-3xl w-full m-6 p-6 rounded-xl overflow-hidden bg-card/95 backdrop-blur-sm">
          <DialogTitle>Audio Details</DialogTitle>
          <DialogDescription>View and manage your saved audio</DialogDescription>
          
          {viewedAudio && (
            <div className="relative mt-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full"
                onClick={() => setViewAudioId(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{viewedAudio.title}</h3>
                <div className="bg-muted/30 p-4 rounded-md max-h-48 overflow-y-auto">
                  <p className="text-sm text-muted-foreground">{viewedAudio.text}</p>
                </div>

                <div className="py-2">
                  <audio controls className="w-full">
                    <source src={viewedAudio.url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <Button onClick={() => downloadAudio(viewedAudio.url, `${viewedAudio.title}.mp3`)} className="transition-colors hover:bg-primary/80">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="destructive" onClick={() => handleDeleteAudio(viewedAudio.id)} className="transition-colors hover:bg-destructive/80">
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

export default VoiceGenerator;
