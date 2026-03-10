# Changelog

All notable changes to WAPSBot will be documented in this file.

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
