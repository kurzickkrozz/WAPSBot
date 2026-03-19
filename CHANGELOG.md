# Changelog

All notable changes to WAPSBot will be documented in this file.

## [1.2.0] - 2026-03-18

### Added
- `/wapstest` command — weighted WAPS practice test (50 or 100 questions) with high-yield chapter emphasis
- `/clearleaderboard` command — admin-only, clear all scores or remove a specific user
- 9 new AFH-1 chapters: 2 (Air Force Organization), 3 (Airpower Operations), 4 (Air Force History), 6 (Joint Operations), 9 (Enlisted Force Structure), 10 (Leadership), 21 (Security), 23 (Cyber Operations), 25 (Drills and Ceremonies)
- Question bank expanded to 1,000 questions across 25 chapters

### Fixed
- Corrected chapter titles and content for chapters 2, 3, 4, 6, 9, 10, 21 to match AFH-1
- Fixed chapter 7 EJPME I grade levels (E-5/E-7 → E-5/E-6)
- Fixed chapter 15 communication step 7 and talking paper answers

## [1.1.4] - 2026-03-10

### Added
- Answer feedback now shows the original question with all options, marking correct/incorrect answers with icons
- Expanded question bank from 410 to 640 questions (40 per chapter across all 16 chapters)
- CHANGELOG.md for tracking release history

### Fixed
- Corrected SRB maximum cap to $180,000 (updated from $100,000 per USAF regulation change)

### Changed
- Bot version now reads from package.json at runtime (single source of truth, still overridable via `BOT_VERSION` env var)
- Updated README to reflect 640-question bank

## [1.1.3] - 2026-03-10

### Added
- Banner and logo images to README

## [1.1.2] - 2026-03-10

### Changed
- Answer buttons styled as grey with blue regional indicator letter emojis

## [1.1.0] - 2026-03-10

### Added
- `/quiz start` and `/quiz cancel` commands with DM-based quiz sessions
- `/chapters` command to list available PFE chapters
- `/score` command for personal stats and quiz history
- `/leaderboard` command for top 10 rankings by accuracy
- `/about` command with bot version, AFH-1 version, test cycle, and question bank stats
- Chapter autocomplete for quiz start
- Optional timed mode (60-second timer per question)
- 410 initial questions across 16 AFH-1 chapters (2026 E-6 PFE)
- JSON flat-file score persistence with atomic writes
- Fisher-Yates shuffle for question randomization
- Docker Compose deployment support
- Roadmap for future features

### Technical
- Built with Sapphire Framework v5.3.2 and Discord.js v14
- TypeScript strict mode
- Environment-variable-overridable bot versioning
