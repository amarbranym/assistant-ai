---
description: 
alwaysApply: true
---

@AGENTS.md
**Project Overview**

This project is a no-code / low-code platform for building AI assistants similar to Vapi, but simpler, cleaner, and more user-friendly. The main goal is to help non-technical users create advanced AI assistants for voice and messaging without needing to understand prompts, APIs, models, or backend workflows deeply.

The platform should let users create assistants for multiple industries and use cases such as real estate, hospitals, gyms, appointment scheduling, customer support, lead generation, and call handling. Each assistant should be able to communicate naturally in real time, adapt dynamically to user input, use business knowledge, trigger tools, and operate across multiple channels.

The product should focus on two core promises:
- easy setup for the builder
- natural, human-like conversations for the end user

---

**Core Vision**

The platform is not just an AI chatbot builder. It is a complete assistant orchestration system that allows users to:
- create multiple assistants
- configure model, voice, channels, knowledge, and tools
- test assistants in real time
- deploy assistants across calls and WhatsApp
- manage conversations, logs, and performance from one dashboard

The main differentiator should be usability. Most existing platforms are powerful but too technical. This product should make advanced assistant creation feel guided, visual, and approachable.

---

**Primary Goals**

- Help non-technical users create assistants quickly
- Support real-time voice and chat-based assistant interactions
- Allow assistants to work across multiple channels
- Make assistant configuration modular and scalable
- Provide powerful features without exposing unnecessary complexity
- Build a system that can expand to more providers, tools, and industries over time

---

**Target Users**

- small business owners
- agencies
- sales teams
- clinics and hospitals
- real estate businesses
- gyms and fitness centers
- customer support teams
- appointment-based businesses
- lead generation teams

These users may not be technical, so the product must rely on guided setup, templates, defaults, and friendly language.

---

**Platform Structure**

The platform can be understood as a multi-step assistant builder with supporting admin and runtime systems.

Main assistant creation flow:
1. subscription and workspace setup
2. assistant basics
3. communication channels
4. model configuration
5. voice configuration
6. knowledge base
7. tools and integrations
8. advanced configuration
9. testing
10. publish / go live

---

**Subscription Plans**

The platform should support multiple plans. A simple early structure is:

`Free`
- up to 2 assistants
- user brings their own API keys
- basic model/voice/channel configuration
- limited usage
- limited tools/knowledge size
- platform branding

`Pro`
- up to 5 assistants
- higher limits
- more tools and knowledge capacity
- analytics access
- better testing and logs
- custom branding options
- priority support

`Unlimited` or `Business`
- unlimited assistants
- advanced usage limits
- team access
- enterprise integrations
- advanced analytics
- dedicated support
- white-label or custom options

Important pricing principle:
The free tier can use a BYO-key model, where users provide their own API keys for Deepgram, ElevenLabs, and their selected AI provider. Your platform provides the builder, orchestration, and assistant runtime layer.

---

**Assistant Basics**

Users should be able to create multiple assistants. Each assistant should have its own identity, purpose, behavior, channels, knowledge, and tools.

Basic assistant setup should include:
- assistant name
- use case / category
- description or purpose
- industry template selection
- language
- tone/personality
- greeting behavior
- primary objective

Possible templates:
- real estate inquiry assistant
- hospital appointment assistant
- gym membership assistant
- scheduling assistant
- lead qualification assistant
- customer support assistant

Templates should prefill prompts, greetings, and recommended settings so non-technical users can launch faster.

---

**Channel Support**

The platform should support dynamic channel connection. In the initial version, support these two channels:

`Calls`
- powered by Twilio
- inbound calling
- outbound calling if needed
- phone number configuration
- real-time voice conversation

`WhatsApp`
- incoming message support
- outgoing message support
- business credential configuration
- assistant-based conversation handling

Users should be able to:
- enable only calls
- enable only WhatsApp
- enable both simultaneously

The assistant should handle communication across enabled channels while keeping the experience unified.

Future channel expansion can include:
- web chat
- Telegram
- Instagram
- Messenger
- email

Important design principle:
Users should think in terms of channels like “Phone” and “WhatsApp,” not provider jargon like “Twilio configuration.”

---

**Model Configuration**

Users should be able to select:
- AI provider
- model under that provider

The system should support dynamic provider/model selection so more providers can be added later.

Conversation initiation modes:
- assistant speaks first
- assistant waits for user
- assistant speaks first with a model-generated message

Additional settings:
- first message
- assistant instructions / system prompt
- max tokens
- temperature

For usability, these settings should be split into:
- basic settings for beginners
- advanced settings for power users

Friendly labels are recommended:
- `Assistant Instructions` instead of `System Prompt`
- `Creativity` instead of `Temperature`
- `Response Length` instead of `Max Tokens`

---

**Voice Configuration**

Voice should be powered by ElevenLabs.

Users should be able to:
- select from available voices
- preview voices before choosing
- upload and use a custom voice if supported
- configure ElevenLabs voice settings

Voice settings may include:
- stability
- similarity
- style
- speaking speed
- expressive level

This experience should feel polished and premium, especially for call-based assistants. Voice preview is very important because it helps users make confident choices.

---

**Knowledge Base**

The platform should include a knowledge module so users can teach the assistant about their business.

Supported knowledge inputs:
- document upload
- attached files
- website URLs
- manual pasted text or notes

Purpose:
- answer business-specific questions
- provide accurate information
- reduce generic replies
- support customer service and operations

Users should be able to:
- add knowledge sources
- remove sources
- refresh sources
- rename sources
- disable sources
- view processing status

Useful processing states:
- processing
- ready
- failed
- last updated

Future improvements:
- citations
- confidence score
- source previews
- scheduled website refresh
- FAQ extraction
- knowledge testing mode

This feature should be presented as “Teach Your Assistant” or “Knowledge & Training” rather than technical RAG terminology.

---

**Tools and Integrations**

The tools module makes the assistant actionable, not just conversational.

Users should be able to use:
- predefined tools
- dynamic/custom tools

Examples:
- TeleCRM
- HubSpot
- webhook-based actions
- Google Sheets
- lead capture tools
- booking or scheduling tools

Predefined tools should support customization through dynamic fields.

Users should be able to:
- configure tool fields
- map values
- define required inputs
- test tool execution
- activate/deactivate tools

The assistant should also be able to collect missing data before triggering a tool. Example: if a CRM tool needs name, phone, and city, the assistant should ask for missing values first.

This module should be presented as:
- `Actions`
- `Integrations`
- or `Assistant Tools`

That is more user-friendly than technical developer wording.

---

**Advanced Configuration**

Advanced configuration should be optional and mainly for fine-tuning.

This module can include:
- model tuning
- voice tuning
- response behavior settings
- channel-specific settings
- silence timeout
- tool confirmation rules
- fallback behavior
- safety and restriction controls
- interruption handling
- max session/call duration
- latency vs quality preference

Important rule:
advanced settings should improve the assistant, not be required to make it work.

---

**Real-Time Testing Module**

After creating an assistant, the user should be able to interact with it in real time to verify behavior before going live.

This is a core product feature, not an optional extra.

Testing should support:
- live text chat
- test voice/call interactions
- conversation history
- tool execution logs
- knowledge usage visibility
- model response behavior checks
- latency/performance feedback
- error/debug visibility

Two modes are recommended:
- `Test Mode`
- `Live Mode`

In Test Mode:
- no real-user impact
- tool execution can be simulated or sandboxed
- users can debug behavior safely

In Live Mode:
- the assistant handles real incoming messages and calls

This module builds trust, improves quality, and reduces deployment mistakes.

---

**Assistant Runtime Behavior**

The assistant should feel natural, adaptive, and human-like in real time.

It should:
- not sound robotic
- understand conversation flow
- adapt based on user responses
- use the right tone and pacing
- handle interruptions in voice calls
- ask follow-up questions when needed
- trigger tools at the right time
- use knowledge intelligently
- maintain context within the session

The assistant should behave differently depending on the channel:
- shorter replies on WhatsApp
- smoother spoken responses on calls
- greeting style based on channel
- channel-specific formatting and timing

---

**Dashboard and Management**

Users need a central dashboard to manage assistants and monitor usage.

Dashboard areas should include:
- assistant list
- assistant status
- channel connection status
- testing access
- recent conversations
- usage summary
- subscription and billing
- knowledge source status
- tool activity
- analytics overview

This dashboard should remain simple and business-friendly.

---

**Analytics and Logs**

To make the product useful for businesses, provide visibility into performance.

Analytics may include:
- total conversations
- calls received
- WhatsApp interactions
- response times
- tool usage count
- failed tool runs
- lead conversions
- appointment outcomes
- knowledge hit rate
- missed calls
- channel-wise performance

Logs may include:
- conversation transcripts
- assistant decisions
- tool execution records
- API/provider failures
- voice session events
- knowledge retrieval events

These features make the platform feel reliable and professional.

---

**Recommended Tech Stack**

Frontend:
- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`

Backend:
- `Node.js`
- `Express`
- `TypeScript`

Database and Auth:
- `Supabase`

Caching and temporary runtime state:
- `Redis`

Realtime communication:
- `WebSockets`

AI integration:
- internal provider abstraction layer
- optionally use `Vercel AI SDK` where helpful

Speech-to-text:
- `Deepgram`

Text-to-speech:
- `ElevenLabs`

Channel provider:
- `Twilio`

Additional useful technologies:
- `BullMQ` for background jobs
- `Stripe` for billing
- `Sentry` for monitoring
- Supabase Storage or equivalent for files and voice assets

---

**High-Level Architecture**

The system should be modular and event-driven.

Frontend responsibilities:
- onboarding
- assistant builder
- testing interface
- dashboard
- analytics
- billing
- settings

Backend responsibilities:
- CRUD APIs
- authentication and authorization
- assistant orchestration
- provider integrations
- tool execution
- knowledge processing
- subscription enforcement
- logs and analytics
- real-time event distribution

Recommended backend modules:
- auth
- users/workspaces
- subscriptions
- assistants
- channels
- model providers
- voice providers
- knowledge
- tools
- conversations
- realtime gateway
- analytics
- jobs/workers

Important architecture principle:
separate assistant logic from provider logic. Do not hardcode Twilio, Deepgram, ElevenLabs, or one LLM provider directly into the core business flow.

Build internal abstractions like:
- `AIProvider`
- `STTProvider`
- `TTSProvider`
- `CallProvider`
- `MessagingProvider`

This makes the system scalable and future-proof.

---

**Advanced AI Assistant Agent Design**

The assistant should be designed as an orchestration engine rather than just a prompt plus model.

Core layers of the agent:

`Instruction Layer`
- defines role, tone, behavior, goals, restrictions

`Context Layer`
- current message
- past messages
- channel info
- user metadata
- assistant config

`Knowledge Layer`
- fetches relevant business information

`Tool Layer`
- triggers integrations and actions

`Decision Layer`
Determines whether the assistant should:
- answer directly
- ask a follow-up question
- use a tool
- retrieve knowledge
- escalate to a human
- retry or recover

`Response Layer`
- formats replies for voice or WhatsApp
- controls tone, brevity, pacing, and structure

`Monitoring Layer`
- logs events
- tracks performance
- supports evaluation and optimization

This structure allows the assistant to become more intelligent over time without requiring major rewrites.

---

**Scalable Feature Design**

To keep the project scalable:
- make assistant configuration data-driven
- keep channels pluggable
- keep tools modular
- process heavy work asynchronously
- use workers for knowledge ingestion and background tasks
- store encrypted credentials securely
- design for multi-tenancy from the beginning
- keep business logic separate from UI
- keep provider-specific settings isolated

---

**Suggested MVP Scope**

For version one, focus on:
- authentication
- plan system
- assistant creation
- Twilio calls
- WhatsApp integration
- model selection
- ElevenLabs voice
- Deepgram STT
- knowledge base
- basic predefined tools
- real-time testing
- publish/go-live flow
- dashboard and basic logs

This is enough to create a strong first version without overbuilding.

---

**Future Features and Improvements**

To make the assistant more advanced and powerful, you can later add:

Conversation intelligence:
- sentiment detection
- intent classification
- objection handling
- multilingual support
- adaptive reply length
- smarter interruption recovery

Memory:
- short-term memory
- long-term customer memory
- repeat caller recognition
- conversation summaries
- saved preferences

Knowledge improvements:
- auto-sync websites
- source citations
- knowledge confidence scoring
- gap detection
- FAQ generation

Tools:
- multi-step workflows
- conditional logic
- approval-based actions
- retries and rollback logic
- reusable tool templates

Channel features:
- missed call follow-up by WhatsApp
- voicemail support
- call transfer/handoff
- channel-specific business hours
- unified conversation history across channels

Business features:
- team access
- role-based permissions
- white-labeling
- advanced analytics
- A/B testing for greetings/prompts
- CRM deep sync
- campaign management

Industry-specific improvements:
- real estate templates
- healthcare scheduling flows
- gym lead capture flows
- support desk workflows
- appointment confirmation flows

---

**Development Approach**

Since you want to build this using Claude Code CLI mode, the best approach is to treat this document as the master implementation blueprint and then break development into modules.

Recommended build order:
1. project foundation and repo structure
2. authentication and workspace system
3. subscription and plan enforcement
4. assistant CRUD and setup flow
5. channel integration layer
6. model and voice configuration
7. knowledge module
8. tools module
9. real-time testing interface
10. publish flow
11. logs and analytics
12. advanced enhancements

For Claude Code CLI execution, define work clearly by:
- module
- API contracts
- database schema
- UI screens
- provider interfaces
- runtime flows

That will make implementation much more reliable.

---

**Final Positioning**

A strong final definition of the project is:

This project is a no-code AI assistant platform that enables non-technical users to create, configure, test, and deploy natural, human-like assistants for voice calls and WhatsApp. The platform supports dynamic model selection, ElevenLabs voice, Deepgram speech-to-text, business knowledge integration, customizable tools, real-time testing, and scalable multi-channel orchestration through a modern modular architecture.

If you want, next I can turn this into one of these:
1. a full PRD document
2. a module-by-module implementation plan
3. a database schema overview
4. a frontend screen-by-screen breakdown
5. a Claude Code CLI task breakdown for development

resign this project and if you need folder structer change you can change now
