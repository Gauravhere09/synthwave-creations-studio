
import React, { useState, useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Slider } from '../components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  generateSpeech,
  Voice,
  TTSOptions,
  ELEVEN_LABS_VOICES,
  ELEVEN_LABS_MODELS
} from '../services/elevenlabsService';
import {
  generateTTSMakerSpeech,
  TTSMakerOptions,
  TTS_MAKER_VOICES
} from '../services/ttsMakerService';
import PageTitle from '../components/PageTitle';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Play, Pause, Download, Trash, Volume2, VolumeX } from 'lucide-react';

interface SavedAudio {
  id: string;
  text: string;
  audioUrl: string;
  provider: 'elevenlabs' | 'ttsmaker';
  voiceName: string;
  date: number;
}

const VoiceGenerator = () => {
  const [elevenLabsKey] = useLocalStorage<string>('eleven-labs-key', '');
  const [ttsMakerKey] = useLocalStorage<string>('tts-maker-key', '');
  const [savedAudios, setSavedAudios] = useLocalStorage<SavedAudio[]>('saved-audios', []);
  
  // Form state
  const [text, setText] = useState<string>('');
  const [provider, setProvider] = useState<'elevenlabs' | 'ttsmaker'>('elevenlabs');
  
  // ElevenLabs settings
  const [elevenLabsVoice, setElevenLabsVoice] = useState<string>(ELEVEN_LABS_VOICES[0].id);
  const [elevenLabsModel, setElevenLabsModel] = useState<string>(ELEVEN_LABS_MODELS[0].id);
  const [stability, setStability] = useState<number>(0.5);
  const [similarityBoost, setSimilarityBoost] = useState<number>(0.75);
  
  // TTSMaker settings
  const [ttsMakerVoice, setTtsMakerVoice] = useState<string>(TTS_MAKER_VOICES[0].id);
  const [speed, setSpeed] = useState<number>(5);
  const [pitch, setPitch] = useState<number>(5);
  const [volume, setVolume] = useState<number>(5);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  
  // Audio playback
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlayingId(null);
      };
    }
  }, []);
  
  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    if ((provider === 'elevenlabs' && !elevenLabsKey) || 
        (provider === 'ttsmaker' && !ttsMakerKey)) {
      toast.error(`Please set your ${provider === 'elevenlabs' ? 'ElevenLabs' : 'TTS Maker'} API key in settings`);
      return;
    }

    setLoading(true);
    try {
      let result;
      let voiceName;
      
      if (provider === 'elevenlabs') {
        const options: TTSOptions = {
          voiceId: elevenLabsVoice,
          text,
          model: elevenLabsModel,
          stability,
          similarityBoost
        };
        
        result = await generateSpeech(options, elevenLabsKey);
        voiceName = ELEVEN_LABS_VOICES.find(v => v.id === elevenLabsVoice)?.name || 'Unknown';
      } else {
        const options: TTSMakerOptions = {
          voiceId: ttsMakerVoice,
          text,
          speed,
          pitch,
          volume
        };
        
        result = await generateTTSMakerSpeech(options, ttsMakerKey);
        voiceName = TTS_MAKER_VOICES.find(v => v.id === ttsMakerVoice)?.name || 'Unknown';
      }
      
      if (result.error) {
        toast.error(result.error);
      } else if (result.audioUrl) {
        setCurrentAudioUrl(result.audioUrl);
        
        // Save the audio
        const savedAudio: SavedAudio = {
          id: `audio_${Date.now()}`,
          text,
          audioUrl: result.audioUrl,
          provider,
          voiceName,
          date: Date.now()
        };
        
        setSavedAudios([savedAudio, ...savedAudios]);
        toast.success('Audio generated successfully');
        
        // Play the audio
        if (audioRef.current) {
          audioRef.current.src = result.audioUrl;
          audioRef.current.play().catch(console.error);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      toast.error('Failed to generate speech');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayAudio = (audioUrl: string, id: string | null = null) => {
    if (audioRef.current) {
      if (isPlaying && currentlyPlayingId === id) {
        audioRef.current.pause();
        setIsPlaying(false);
        setCurrentlyPlayingId(null);
      } else {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
        setCurrentlyPlayingId(id);
      }
    }
  };
  
  const handleDeleteAudio = (id: string) => {
    // If currently playing, stop it
    if (currentlyPlayingId === id && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentlyPlayingId(null);
    }
    
    // Filter out the deleted audio and update state
    setSavedAudios(savedAudios.filter(audio => audio.id !== id));
    toast.success('Audio deleted');
  };

  const downloadAudio = (audio: SavedAudio) => {
    const a = document.createElement('a');
    a.href = audio.audioUrl;
    a.download = `ai-voice-${audio.id}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <PageTitle 
        title="Voice Generator" 
        description="Create speech using AI voices" 
      />

      <Tabs defaultValue="generate">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
        </TabsList>
        
        <TabsContent value="generate" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Generator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="text">Text</Label>
                  <Textarea 
                    id="text"
                    placeholder="Enter the text you want to convert to speech"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider">Voice Provider</Label>
                  <Select 
                    value={provider}
                    onValueChange={(value: 'elevenlabs' | 'ttsmaker') => setProvider(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                      <SelectItem value="ttsmaker">TTS Maker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {provider === 'elevenlabs' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="elevenlabs-voice">Voice</Label>
                      <Select 
                        value={elevenLabsVoice}
                        onValueChange={setElevenLabsVoice}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {ELEVEN_LABS_VOICES.map((voice) => (
                            <SelectItem 
                              key={voice.id} 
                              value={voice.id}
                            >
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="elevenlabs-model">Model</Label>
                      <Select 
                        value={elevenLabsModel}
                        onValueChange={setElevenLabsModel}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {ELEVEN_LABS_MODELS.map((model) => (
                            <SelectItem 
                              key={model.id} 
                              value={model.id}
                            >
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="stability">Stability: {stability.toFixed(2)}</Label>
                      </div>
                      <Slider 
                        id="stability"
                        min={0} 
                        max={1} 
                        step={0.01}
                        value={[stability]}
                        onValueChange={(value) => setStability(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Variable</span>
                        <span>Stable</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="similarity-boost">Similarity Boost: {similarityBoost.toFixed(2)}</Label>
                      </div>
                      <Slider 
                        id="similarity-boost"
                        min={0} 
                        max={1} 
                        step={0.01}
                        value={[similarityBoost]}
                        onValueChange={(value) => setSimilarityBoost(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Creative</span>
                        <span>Similar</span>
                      </div>
                    </div>
                    
                    {!elevenLabsKey && (
                      <p className="text-sm text-destructive">
                        Please add your ElevenLabs API key in settings
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ttsmaker-voice">Voice</Label>
                      <Select 
                        value={ttsMakerVoice}
                        onValueChange={setTtsMakerVoice}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {TTS_MAKER_VOICES.map((voice) => (
                            <SelectItem 
                              key={voice.id} 
                              value={voice.id}
                            >
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="speed">Speed: {speed}</Label>
                      </div>
                      <Slider 
                        id="speed"
                        min={0} 
                        max={10} 
                        step={1}
                        value={[speed]}
                        onValueChange={(value) => setSpeed(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Slow</span>
                        <span>Fast</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="pitch">Pitch: {pitch}</Label>
                      </div>
                      <Slider 
                        id="pitch"
                        min={0} 
                        max={10} 
                        step={1}
                        value={[pitch]}
                        onValueChange={(value) => setPitch(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low</span>
                        <span>High</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="volume">Volume: {volume}</Label>
                      </div>
                      <Slider 
                        id="volume"
                        min={0} 
                        max={10} 
                        step={1}
                        value={[volume]}
                        onValueChange={(value) => setVolume(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Quiet</span>
                        <span>Loud</span>
                      </div>
                    </div>
                    
                    {!ttsMakerKey && (
                      <p className="text-sm text-destructive">
                        Please add your TTS Maker API key in settings
                      </p>
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={handleGenerate} 
                  disabled={
                    loading || 
                    !text.trim() || 
                    (provider === 'elevenlabs' && !elevenLabsKey) ||
                    (provider === 'ttsmaker' && !ttsMakerKey)
                  }
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Generating...</span>
                    </>
                  ) : (
                    'Generate Voice'
                  )}
                </Button>
                
                {currentAudioUrl && (
                  <div className="p-4 bg-secondary rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => togglePlayAudio(currentAudioUrl)}
                      >
                        {isPlaying && !currentlyPlayingId ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      <span className="text-sm">Preview</span>
                    </div>
                    <audio ref={audioRef} className="hidden" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="library" className="mt-4">
          {savedAudios.length > 0 ? (
            <div className="space-y-4">
              {savedAudios.map((audio) => (
                <Card key={audio.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            <span className="text-muted-foreground">{audio.provider === 'elevenlabs' ? 'ElevenLabs' : 'TTS Maker'}</span>
                            &nbsp;•&nbsp;{audio.voiceName}
                          </CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(audio.date).toLocaleDateString()} {new Date(audio.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => togglePlayAudio(audio.audioUrl, audio.id)}
                        >
                          {isPlaying && currentlyPlayingId === audio.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => downloadAudio(audio)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteAudio(audio.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {audio.text.length > 100 
                        ? `${audio.text.substring(0, 100)}...` 
                        : audio.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No saved audios yet"
              description="Generate speech to populate your library"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceGenerator;
