
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import PageTitle from '../components/PageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { supabase } from '../integrations/supabase/client';
import { Trash, Play, Pause, Download, Clock, Volume2 } from 'lucide-react';

// Import only the ElevenLabs service since we're removing TTS Maker
import { synthesizeSpeech, Voice, getVoices } from '../services/elevenlabsService';

interface SavedAudio {
  id: string;
  title: string;
  text: string;
  url: string;
  voice_id: string;
  created_at: string | number;
}

const VoiceGenerator = () => {
  const [elevenLabsKey] = useLocalStorage<string>('eleven-labs-key', '');
  
  // Form state
  const [text, setText] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [voiceId, setVoiceId] = useState<string>('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [stability, setStability] = useState<number>(0.5);
  const [clarity, setClarity] = useState<number>(0.5);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingVoices, setLoadingVoices] = useState<boolean>(false);
  const [loadingAudioList, setLoadingAudioList] = useState<boolean>(false);
  const [currentAudio, setCurrentAudio] = useState<SavedAudio | null>(null);
  const [savedAudios, setSavedAudios] = useState<SavedAudio[]>([]);
  const [audioPlayer] = useState(new Audio());
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  
  // Fetch voices and saved audios on component mount
  useEffect(() => {
    if (elevenLabsKey) {
      fetchVoices();
    }
    fetchSavedAudios();
    
    return () => {
      audioPlayer.pause();
    };
  }, [elevenLabsKey]);
  
  // Listen to audio player events
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(null);
    };
    
    audioPlayer.addEventListener('ended', handleEnded);
    
    return () => {
      audioPlayer.removeEventListener('ended', handleEnded);
    };
  }, [audioPlayer]);

  const fetchVoices = async () => {
    setLoadingVoices(true);
    try {
      const fetchedVoices = await getVoices(elevenLabsKey);
      setVoices(fetchedVoices);
      // Set a default voice if available
      if (fetchedVoices.length > 0 && !voiceId) {
        setVoiceId(fetchedVoices[0].voice_id);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      toast.error('Failed to fetch voices');
    } finally {
      setLoadingVoices(false);
    }
  };
  
  const fetchSavedAudios = async () => {
    setLoadingAudioList(true);
    try {
      const { data, error } = await supabase
        .from('audio')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSavedAudios(data || []);
    } catch (error) {
      console.error('Error fetching audio:', error);
      toast.error('Failed to load saved audio files');
    } finally {
      setLoadingAudioList(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }
    
    if (!title.trim()) {
      toast.error('Please enter a title');
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

    setLoading(true);
    try {
      const audioUrl = await synthesizeSpeech(
        elevenLabsKey,
        voiceId,
        text,
        stability,
        clarity
      );
      
      // Save to Supabase
      const { data, error } = await supabase
        .from('audio')
        .insert([{
          title,
          text,
          url: audioUrl,
          voice_id: voiceId
        }])
        .select();
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentAudio(data[0]);
        toast.success('Audio generated successfully');
        fetchSavedAudios();
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Failed to generate audio');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = (audio: SavedAudio) => {
    if (isPlaying === audio.id) {
      audioPlayer.pause();
      setIsPlaying(null);
    } else {
      if (isPlaying) {
        audioPlayer.pause();
      }
      audioPlayer.src = audio.url;
      audioPlayer.play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio');
      });
      setIsPlaying(audio.id);
    }
  };

  const handleDownload = (audio: SavedAudio) => {
    const a = document.createElement('a');
    a.href = audio.url;
    a.download = `${audio.title.replace(/\s+/g, '-')}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('audio')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSavedAudios(savedAudios.filter(audio => audio.id !== id));
      
      if (currentAudio?.id === id) {
        setCurrentAudio(null);
      }
      
      if (isPlaying === id) {
        audioPlayer.pause();
        setIsPlaying(null);
      }
      
      toast.success('Audio deleted successfully');
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error('Failed to delete audio');
    }
  };

  // Selected voice details
  const selectedVoice = voices.find(voice => voice.voice_id === voiceId);

  return (
    <div className="transition-all hover:scale-[1.01]">
      <PageTitle 
        title="Voice Generator" 
        description="Transform text to speech using ElevenLabs AI" 
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="transition-colors hover:bg-primary/20">Generate</TabsTrigger>
          <TabsTrigger value="saved" className="transition-colors hover:bg-primary/20">Community Audio</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4 mt-4">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle>Voice Settings</CardTitle>
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
                    className="min-h-32 transition-colors hover:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="voice">Voice</Label>
                  {loadingVoices ? (
                    <div className="flex justify-center p-2">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <Select 
                      value={voiceId} 
                      onValueChange={setVoiceId}
                      disabled={voices.length === 0}
                    >
                      <SelectTrigger className="transition-colors hover:border-primary">
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem 
                            key={voice.voice_id} 
                            value={voice.voice_id}
                            className="transition-colors hover:bg-primary/20"
                          >
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {!elevenLabsKey && (
                    <p className="text-sm text-destructive">
                      Please add your ElevenLabs API key in settings
                    </p>
                  )}
                </div>
                
                {selectedVoice && (
                  <div className="rounded-md bg-muted p-3">
                    <h4 className="text-sm font-medium mb-2">Selected Voice: {selectedVoice.name}</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label htmlFor="stability" className="text-xs">Stability: {stability}</Label>
                        </div>
                        <Slider 
                          id="stability"
                          min={0} 
                          max={1} 
                          step={0.01}
                          value={[stability]}
                          onValueChange={(value) => setStability(value[0])}
                          className="transition-colors hover:bg-primary/20"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Dynamic</span>
                          <span>Stable</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <Label htmlFor="clarity" className="text-xs">Clarity: {clarity}</Label>
                        </div>
                        <Slider 
                          id="clarity"
                          min={0} 
                          max={1} 
                          step={0.01}
                          value={[clarity]}
                          onValueChange={(value) => setClarity(value[0])}
                          className="transition-colors hover:bg-primary/20"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Natural</span>
                          <span>Clear</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerate}
                  disabled={loading || !text.trim() || !voiceId || !elevenLabsKey || !title.trim()}
                  className="w-full transition-colors hover:bg-primary/80"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    'Generate Audio'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {currentAudio && (
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{currentAudio.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{currentAudio.text}</p>
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-md">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePlayPause(currentAudio)}
                    className="transition-colors hover:bg-primary/20"
                  >
                    {isPlaying === currentAudio.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <span className="text-sm font-medium">Preview Audio</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownload(currentAudio)}
                    className="transition-colors hover:bg-primary/20"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="saved" className="mt-4">
          {loadingAudioList ? (
            <div className="flex justify-center p-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : savedAudios.length > 0 ? (
            <div className="space-y-3">
              {savedAudios.map((audio) => (
                <Card key={audio.id} className="transition-shadow hover:shadow-lg">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{audio.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{audio.text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePlayPause(audio)}
                          className="transition-colors hover:bg-primary/20"
                        >
                          {isPlaying === audio.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDownload(audio)}
                          className="transition-colors hover:bg-primary/20"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(audio.id)}
                          className="text-destructive transition-colors hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(audio.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No saved audio files"
              description="Generate audio to see it here"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceGenerator;
