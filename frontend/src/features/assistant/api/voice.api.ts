import { apiRequest } from "@/lib/api/client";

export type VoiceCatalogItem = {
  id: string;
  name: string;
  previewUrl: string | null;
  labels: Record<string, string>;
};

export async function fetchVoiceCatalog(): Promise<VoiceCatalogItem[]> {
  const data = await apiRequest<{ voices: VoiceCatalogItem[] }>("/api/v1/voice/voices", {
    method: "GET"
  });
  return data.voices ?? [];
}

export async function generateVoicePreview(input: {
  voiceId: string;
  text?: string;
}): Promise<{ mimeType: string; audio: string }> {
  return apiRequest<{ mimeType: string; audio: string }>("/api/v1/voice/voices/preview", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function uploadCustomVoice(input: {
  name: string;
  description?: string;
  fileName: string;
  mimeType: string;
  audioBase64: string;
}): Promise<{ id: string; name: string }> {
  return apiRequest<{ id: string; name: string }>("/api/v1/voice/voices/custom", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
