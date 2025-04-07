
export interface Script {
  id: string;
  title: string;
  prompt: string;
  content: string;
  user_id?: string;
  created_at: string;
}

export interface SavedImage {
  id: string;
  prompt: string;
  url: string;
  base64_image: string;
  params: any;
  user_id?: string;
  created_at: string;
}

export interface SavedAudio {
  id: string;
  title: string;
  text: string;
  url: string;
  voice_id?: string;
  user_id?: string;
  created_at: string;
}
