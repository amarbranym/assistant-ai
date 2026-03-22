import type { AssistantRecord } from "../types/api-assistant";

/**
 * Static seed data for UI development (no network).
 */
export const MOCK_ASSISTANTS: AssistantRecord[] = [
  {
    id: "cd02fa14-98cc-4d53-92a4-8f6b95eb0c11",
    name: "Riley",
    description: "Appointment scheduling for Wellness Partners.",
    projectId: null,
    active: true,
    config: {
      name: "Riley",
      voice: {
        model: "eleven_turbo_v2_5",
        voiceId: "MZb4jD8N3GIedB0K3Xoi",
        provider: "11labs",
      },
      model: { model: "gpt-4.1", provider: "openai" },
    },
    createdAt: "2026-02-26T15:37:01.636Z",
    updatedAt: "2026-03-18T11:35:24.837Z",
  },
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Jordan",
    description: "Concise support triage and FAQs.",
    projectId: null,
    active: true,
    config: {
      voice: {
        model: "eleven_multilingual_v2",
        voiceId: "voice_demo_01",
        provider: "elevenlabs",
      },
      model: { model: "gpt-4.1-mini", provider: "openai" },
    },
    createdAt: "2026-03-01T09:00:00.000Z",
    updatedAt: "2026-03-19T14:22:10.000Z",
  },
  {
    id: "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    name: "Morgan",
    description: "Outbound reminders — paused.",
    projectId: null,
    active: false,
    config: {},
    createdAt: "2026-03-10T12:00:00.000Z",
    updatedAt: "2026-03-15T08:30:00.000Z",
  },
];
