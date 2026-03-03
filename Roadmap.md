# WAPS PFE Quiz Bot — Roadmap

## Current (v1.0)
- [x] DM-based multiple-choice quiz sessions
- [x] JSON question bank import (one file per chapter)
- [x] Chapter selection or full-bank random quizzes
- [x] User-selectable question count
- [x] Score tracking with JSON flat-file storage
- [x] Leaderboard

---

## Planned Enhancements

### Flashcard Mode
- `/flashcard start [chapter]` — shows a question, user mentally answers, clicks "Reveal" to see the answer
- Self-graded: user marks "Got it" or "Missed it"
- Lower-stakes study format for review sessions

### Spaced Repetition (SM-2)
- Track per-question difficulty and next-review date using the SM-2 algorithm
- `/study` command pulls questions you're weakest on, prioritizing overdue reviews
- Optimizes long-term retention over random quizzing

### Progress Tracking Dashboard
- `/progress` — detailed breakdown by chapter: accuracy, attempts, trend over time
- Identify weakest chapters and recommend study focus
- Visual progress bars in embeds

### SKT (Specialty Knowledge Test) Support
- Extend category system beyond PFE to support AFSC-specific SKT question banks
- `/quiz start type:skt afsc:3D0X2` style filtering

### Timed Practice Tests
- Simulate actual WAPS test conditions (100 questions, timed)
- `/practice-test` — full-length mock exam with a countdown timer
- No question-by-question feedback until the end

### Multi-Guild Support
- Per-guild configuration (admin channels, roles, settings)
- Guild-scoped leaderboards
- Migrate from JSON flat files to PostgreSQL + Prisma

### Question Bank Management
- `/admin import` — upload a JSON file directly via Discord attachment
- `/admin add` — add individual questions via modal form
- `/admin edit` / `/admin delete` — manage questions in-place
- Question bank versioning tied to AFH-1 edition year

### Study Groups
- `/group create` — form a study group, quiz together in a thread
- Competitive mode: same questions, race to answer first
- Collaborative mode: discuss answers before locking in

### Analytics & Insights
- Weekly study report DMs with stats and recommendations
- Server-wide analytics for admins (who's studying, engagement trends)
- Integration with chart/image generation for visual reports

### Weighted Question Selection
- Bias quiz generation toward chapters with new/updated material
- Configurable weight multipliers per chapter (e.g., 2x for Ch. 11, 12, 17 in 2026)
- Automatic de-emphasis of chapters with high user accuracy
