# Prosody — AI Speech & Social Skills Trainer

Train everyday speaking and social confidence with AI-powered delivery analysis. Prosody analyzes both **what** you say and **how** you say it — pace, pauses, pitch, filler words, and more.

## Features

- **7 Practice Modes** — Impromptu, Prepared, Debate, Interview, Storytelling, Social Scenarios, Rapid Fire
- **Delivery Analysis** — Real audio signal processing: pitch tracking, pace measurement, pause detection, filler word analysis
- **Content Analysis** — LLM-powered structure, coherence, specificity, and vocabulary scoring
- **Personalized Feedback** — One actionable focus point per session, not a wall of criticism
- **Progress Dashboard** — Trend graphs, skill radar charts, streaks, badges, and personal baseline calibration
- **Conversational Modes** — AI debate rebuttals and interview follow-ups

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and add your OpenAI API key:

```bash
cp .env.example .env
```

```
OPENAI_API_KEY=sk-your-key-here
DATABASE_URL="file:./dev.db"
```

### 3. Set up the database

```bash
npm run db:push
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
Audio capture → Whisper STT → parallel branches:
  ├── Transcript → GPT content analysis
  └── Raw audio → DSP feature extraction (pitch, pace, pauses, energy)
       ↓
Feedback synthesis (GPT combines signals) → Session storage → Dashboard
```

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Framer Motion, Recharts
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma
- **AI**: OpenAI GPT-4o-mini (topics, content analysis, feedback) + Whisper (transcription)
- **Audio DSP**: Custom pitch detection (autocorrelation), pause analysis from word timestamps, volume RMS

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/topics` | POST | Generate a practice topic |
| `/api/analyze` | POST | Transcribe + analyze audio, save session |
| `/api/sessions` | GET/POST | List sessions / save reflection |
| `/api/dashboard` | GET | Full dashboard data |
| `/api/conversational` | POST | Debate rebuttals & interview follow-ups |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── practice/page.tsx     # Practice flow
│   ├── dashboard/page.tsx    # Analytics dashboard
│   └── api/                  # API routes
├── components/
│   ├── audio-recorder.tsx    # Recording UI with visualizer
│   ├── session-results.tsx   # Post-session feedback display
│   └── ui/                   # Shared UI components
├── lib/
│   ├── openai.ts             # OpenAI integration
│   ├── audio-analysis.ts     # DSP pipeline
│   ├── badges.ts             # Gamification logic
│   └── db.ts                 # Prisma client
└── types/index.ts            # TypeScript types
```

## Roadmap

- [x] Phase 1: Core loop (topic → record → transcribe → content feedback → streaks)
- [x] Phase 2: Delivery analysis (pitch, pace, pauses, fillers)
- [x] Phase 3: Conversational modes (debate, interview)
- [x] Phase 4: Gamification (badges, daily challenges, trends)
- [ ] Phase 5: Webcam/body language, multi-language, custom topic decks

## License

MIT
