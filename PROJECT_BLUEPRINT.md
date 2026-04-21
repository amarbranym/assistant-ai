# Assistant AI Platform Blueprint

This repository is structured to build a no-code/low-code assistant platform for non-technical teams.

## Product Direction

- Multi-assistant workspace model with guided setup.
- Channel-first experience (`Phone`, `WhatsApp`) with provider abstraction.
- Real-time voice and chat test console before publish.
- Business-friendly UX with templates, defaults, and progressive advanced settings.

## Backend Module Boundaries

- `auth` / `user`: identity and access.
- `assistant`: assistant CRUD, template defaults, assistant configuration storage.
- `channels`: channel adapters and channel-specific runtime behavior.
- `llm`: model invocation and prompt orchestration.
- `voice`: real-time audio runtime and provider adapters.
- `conversations`: transcripts and session history.

## Provider Abstraction Rules

Core orchestration code must not call vendor SDKs directly. Route through adapters:

- `AIProvider`
- `STTProvider`
- `TTSProvider`
- `CallProvider`
- `MessagingProvider`

Current implementation in this repo includes:

- `voice/providers/stt.provider.ts` (Deepgram-backed, pluggable)
- `voice/providers/tts.provider.ts` (ElevenLabs-backed, pluggable)

## Assistant Builder Stages (Frontend)

1. Basics
2. Channels
3. Model
4. Voice
5. Knowledge
6. Actions
7. Advanced
8. Test
9. Publish

Each stage should expose beginner-safe defaults and optional advanced controls.

## Configuration Shape Principles

- Keep assistant configuration data-driven (`assistant.config`).
- Store provider-specific fields under isolated keys per module.
- Keep UI labels user-friendly (`Creativity`, `Response Length`, `Assistant Instructions`).
- Keep hard limits and plan enforcement in backend services, not UI-only.

## Runtime Principles

- Voice runtime: barge-in support, interruption-safe playback, low-latency STT->LLM->TTS loop.
- Channel-aware response formatting (short text for WhatsApp, natural pacing for calls).
- Tool-aware dialogue flow (collect missing fields before execution).
- Event-based logging for observability and analytics.

## MVP Delivery Sequence

1. Auth + workspace
2. Plan enforcement
3. Assistant CRUD and templates
4. Voice + channel integrations
5. Knowledge ingestion + retrieval
6. Actions/tools execution
7. Test mode and go-live switch
8. Logs and analytics

## Definition of Professional Quality

- Explicit module boundaries and interfaces.
- Vendor-neutral orchestration layer.
- Predictable configuration contracts.
- Clear observability for runtime decisions and failures.
- UI copy optimized for non-technical users.
