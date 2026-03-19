<p align="center">
  <img src="banner.png" alt="WAPSBot Banner" />
</p>

<p align="center">
  <img src="logo.png" alt="WAPSBot Logo" width="128" />
</p>

# WAPS PFE Quiz Bot

A Discord bot for studying USAF WAPS (Weighted Airman Promotion System) PFE (Promotion Fitness Examination) material. Delivers DM-based multiple-choice quiz sessions sourced from AFH-1 (Air Force Handbook 1) question banks.

Built with [Sapphire Framework](https://www.sapphirejs.dev/) and [Discord.js](https://discord.js.org/).

## Features

- **DM-based quizzes** — Questions are delivered privately via direct message
- **Chapter selection** — Quiz on a specific AFH-1 chapter or the full question bank
- **Configurable length** — Choose how many questions per quiz session
- **Timed mode** — Optional 60-second timer per question (default: untimed)
- **Score tracking** — Persistent per-user stats with quiz history
- **Leaderboard** — Guild-wide rankings by accuracy
- **WAPS practice test** — Weighted 50 or 100-question mock exams with high-yield chapter emphasis
- **Question bank** — 1,000 questions across 25 AFH-1 chapters

## Commands

| Command | Description |
|---------|-------------|
| `/quiz start [chapter] [count] [timed]` | Start a DM quiz session |
| `/quiz cancel` | Cancel your active quiz session |
| `/wapstest [count] [timed]` | Start a weighted WAPS practice test (50 or 100 questions) |
| `/chapters` | List available PFE chapters with question counts |
| `/score` | View your personal stats and recent history |
| `/leaderboard` | Top 10 users by accuracy (min 10 questions) |
| `/clearleaderboard [user]` | Clear all scores or remove a specific user (admin only) |
| `/about` | Bot version and information |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- A [Discord bot token](https://discord.com/developers/applications)
- [Docker](https://www.docker.com/) (for production deployment)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/kurzickkrozz/WAPSBot.git
   cd WAPSBot
   ```

2. Copy the environment template and add your bot token:
   ```bash
   cp .env.example .env
   ```
   ```env
   DISCORD_TOKEN=your_bot_token_here
   NODE_ENV=development
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Build and start:
   ```bash
   npm run build
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

### Docker Deployment

```bash
docker compose up -d --build
```

The `data/` directory is mounted as a volume, so question banks and scores persist across container rebuilds.

## Question Bank

Questions are stored as JSON files in `data/questions/`. Each file represents one AFH-1 chapter. Files starting with `_` (like `_example.json`) are ignored by the loader.

### Schema

```json
{
  "chapter": "Chapter 1",
  "title": "Developing Airmen",
  "questions": [
    {
      "id": "ch1_001",
      "question": "What is the primary purpose of the Enlisted Force Structure?",
      "options": [
        "Define career progression timelines",
        "Describe the roles, responsibilities, and expectations of each enlisted rank",
        "Establish promotion testing schedules",
        "Outline disciplinary procedures"
      ],
      "answer": 1,
      "reference": "AFH 1, Ch. 1"
    }
  ]
}
```

- `answer` — Zero-based index into the `options` array
- `reference` — Optional study reference shown on the review screen
- `options` — Exactly 4 answer choices

### Included Chapters

Chapters 1–22, 24, 25 (25 chapters total)

## Configuration

Bot versioning and metadata are configurable via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_TOKEN` | — | Discord bot token (required) |
| `NODE_ENV` | `development` | Environment (`development` or `production`) |
| `BOT_VERSION` | `1.2.0` | Displayed bot version |
| `AFH1_VERSION` | `15 February 2025` | AFH-1 publication date |
| `TEST_CYCLE` | `26E5 / 26E6` | Current WAPS test cycle |
| `BOT_DEVELOPER` | `TunnelRat` | Developer name shown in `/about` |

## Project Structure

```
WAPSBot/
├── src/
│   ├── index.ts                           # Sapphire client init + login
│   ├── commands/                           # Slash commands
│   │   ├── quiz.ts                        #   /quiz start, /quiz cancel
│   │   ├── wapstest.ts                    #   /wapstest
│   │   ├── chapters.ts                    #   /chapters
│   │   ├── score.ts                       #   /score
│   │   ├── leaderboard.ts                 #   /leaderboard
│   │   ├── clearleaderboard.ts            #   /clearleaderboard
│   │   └── about.ts                       #   /about
│   ├── interaction-handlers/
│   │   └── quiz-autocomplete.ts           # Chapter autocomplete
│   ├── listeners/
│   │   └── ready.ts                       # Startup banner + chapter loading
│   ├── lib/
│   │   ├── setup.ts                       # Env, plugin registration
│   │   ├── config.ts                      # Constants and env overrides
│   │   ├── quiz-engine.ts                 # Quiz logic and session management
│   │   ├── store.ts                       # JSON flat-file score storage
│   │   └── utils.ts                       # Embed builders
│   └── types/
│       └── quiz.ts                        # Shared interfaces
├── data/
│   ├── questions/                         # Question bank JSON files
│   └── scores.json                        # User scores (auto-created)
├── Dockerfile
├── docker-compose.yml
└── Roadmap.md                             # Future feature ideas
```

## License

See [LICENSE](LICENSE) for details.
