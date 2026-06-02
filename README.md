# Know Your Scales

Interactive music theory learning platform — scales, ear training, quizzes, lessons, and progress tracking.

**Live demo (frontend):** https://malvin-26.github.io/KnowYourScales/

> GitHub Pages hosts the static React app only. Sign-in, quizzes, and lesson credits require the API running separately (local or a cloud host).

## Features

- Scale Explorer with piano keyboard and circle of fifths
- **Lessons** — 5 lessons under *Introduction to Scales* (video + reading, +30 credits each)
- Ear training, quizzes, chord progressions, song practice
- XP, streaks, achievements, dashboard

## Quick Start (local full stack)

### Prerequisites

- Node.js **22.5+**
- npm

### Setup

```bash
git clone https://github.com/Malvin-26/KnowYourScales.git
cd KnowYourScales
./setup.ps1   # Windows — or install manually below
```

```bash
npm install
cp server/.env.example server/.env   # set JWT_SECRET (32+ chars)
npm run db:seed
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

## GitHub Pages deployment

Pushes to `main` run `.github/workflows/deploy-pages.yml`, which builds the client with `base: /KnowYourScales/` and deploys to GitHub Pages.

**One-time repo settings:**

1. **Settings → Pages → Build and deployment:** Source = **GitHub Actions**
2. Wait for the workflow to finish after pushing to `main`

The site must be served from `https://<user>.github.io/KnowYourScales/` (project site), not the user root domain.

## Environment (`server/.env`)

```env
PORT=3001
JWT_SECRET=your-random-secret-at-least-32-characters
DATABASE_PATH=./data/knowyourscales.db
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,https://malvin-26.github.io
```

Never commit `server/.env` — it is gitignored.

## Production API + Pages

Host the server (Render, Railway, Fly.io, VPS) and set the frontend build variable:

```bash
VITE_API_BASE=https://your-api.example.com/api npm run build --workspace=know-your-scales-client
```

For GitHub Actions, add `VITE_API_BASE` as a repository secret and pass it in the deploy workflow.

## Docker

```bash
docker compose up --build
```

## License

MIT
