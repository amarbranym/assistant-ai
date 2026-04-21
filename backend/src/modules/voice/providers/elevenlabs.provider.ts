export type ElevenLabsVoiceRequest = {
  text: string;
  voiceId: string;
  modelId: string;
  abortSignal?: AbortSignal;
  optimizeStreamingLatency?: number;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  voiceSpeed?: number;
  useSpeakerBoost?: boolean;
  onChunk: (chunk: Buffer) => Promise<void> | void;
};

export type ElevenLabsVoice = {
  id: string;
  name: string;
  previewUrl: string | null;
  labels: Record<string, string>;
};

function elevenLabsApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }
  return key;
}

export async function streamElevenLabsSpeech(input: ElevenLabsVoiceRequest): Promise<void> {
  const key = elevenLabsApiKey();
  const voiceId = input.voiceId || "EXAVITQu4vr4xnSDxMaL";
  const modelId = input.modelId || "eleven_turbo_v2_5";
  const latency = Math.min(4, Math.max(0, Math.floor(input.optimizeStreamingLatency ?? 2)));
  const stability = input.voiceStability ?? 0.5;
  const similarityBoost = input.voiceSimilarityBoost ?? 0.75;
  const speed = input.voiceSpeed ?? 1;
  const useSpeakerBoost = input.useSpeakerBoost !== false;

  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?optimize_streaming_latency=${latency}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg"
      },
      body: JSON.stringify({
        text: input.text,
        model_id: modelId,
        output_format: "mp3_22050_32",
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          speed,
          use_speaker_boost: useSpeakerBoost
        }
      }),
      signal: input.abortSignal
    }
  );

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${text || res.statusText}`);
  }

  const reader = res.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value || value.byteLength === 0) continue;
    await input.onChunk(Buffer.from(value));
  }
}

export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  const key = elevenLabsApiKey();
  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    method: "GET",
    headers: { "xi-api-key": key }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to fetch ElevenLabs voices (${res.status}): ${text || res.statusText}`);
  }
  const json = (await res.json()) as {
    voices?: Array<{
      voice_id?: string;
      name?: string;
      preview_url?: string | null;
      labels?: Record<string, string>;
    }>;
  };
  return (json.voices ?? [])
    .filter((v) => typeof v.voice_id === "string" && typeof v.name === "string")
    .map((v) => ({
      id: v.voice_id as string,
      name: v.name as string,
      previewUrl: typeof v.preview_url === "string" ? v.preview_url : null,
      labels: v.labels ?? {}
    }));
}

export async function createElevenLabsCustomVoice(input: {
  name: string;
  description?: string;
  fileName: string;
  mimeType: string;
  audioBase64: string;
}): Promise<{ id: string; name: string }> {
  const key = elevenLabsApiKey();
  const bytes = Buffer.from(input.audioBase64, "base64");
  if (bytes.byteLength === 0) {
    throw new Error("Uploaded audio file is empty");
  }

  const form = new FormData();
  form.set("name", input.name);
  if (input.description?.trim()) {
    form.set("description", input.description.trim());
  }
  form.append("files", new Blob([bytes], { type: input.mimeType }), input.fileName);

  const res = await fetch("https://api.elevenlabs.io/v1/voices/add", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: form
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to upload custom voice (${res.status}): ${text || res.statusText}`);
  }
  const json = (await res.json()) as { voice_id?: string; name?: string };
  if (!json.voice_id) {
    throw new Error("ElevenLabs did not return a voice id");
  }
  return { id: json.voice_id, name: json.name ?? input.name };
}

