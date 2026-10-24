# ToddleBee

ToddleBee is a bilingual learning companion for children aged 8–12. The first lesson is Grade 4 fractions in English or Tamil, with supportive practice, progress insights, and a human educator review path.

## Run on Replit

The project uses the shared Express API server and the ToddleBee Vite web app. Replit starts them as separate workflows. The project PostgreSQL database is used for learning sessions, quiz attempts, educator reviews, and local demo activity.

```bash
pnpm --filter @workspace/db run push
pnpm run typecheck
```

The database push has already been applied in this development environment. Do not run it against production without reviewing the target database first.

## Learning experience

- `/` — choose English or Tamil, age, and Grade 4; begin a session or open the sample lesson.
- `/learn` — five short, bilingual fractions sections with a picture, an alternative explanation, and narration controls.
- `/quiz` — five questions, checked against server-side answer keys. A first incorrect answer gets a hint, repeated difficulty can create an educator review, and no score is trusted from the browser.
- `/progress` — actual activity after a session begins; the initial example is explicitly labelled sample data.
- `/parent` — supportive, non-diagnostic guidance.
- `/admin` — demo-only educator review flow. Any demo access gate is not production authentication.
- `/pricing` — proposed ToddleBee Plus details. Pine Labs is unavailable in this demo; no payment is collected and no access is granted.

The app stores anonymous session details, learning events, and quiz attempts. It does not request a child's name, phone number, or location.

## Integrations and fallbacks

### ElevenLabs

On Replit, the backend calls ElevenLabs through the connected Replit integration. The backend chooses only voices with child-friendly metadata or a voice ID explicitly configured by the app owner. Audio is generated for one explanation at a time; the lesson remains readable without it.

If the connected voice list cannot be loaded, update the ElevenLabs API key in the existing Replit connection. Do not put the key in source code or chat. If running outside Replit, set the server-only environment variables below. Choose voice IDs that are appropriate for children; `ELEVENLABS_TAMIL_VOICE_ID` is optional.

### AgenticOrg and Pine Labs

These providers are not connected for this demo. The learning coach and activity panel use a clearly labelled local simulation; it does not create AgenticOrg run IDs or audit records. Checkout reports unavailable, accepts no card details, and never grants premium access. A real provider integration requires its approved account access and documented sandbox setup.

## Environment

See `.env.example` for placeholders. `DATABASE_URL` is provided by Replit for this project; a Render deployment needs its own PostgreSQL connection string. Provider credentials must be stored as server-side secrets, never as `VITE_` variables.

## Build and checks

```bash
pnpm run typecheck
pnpm --filter @workspace/toddlebee run build
pnpm --filter @workspace/api-server run build
```

`GET /api/health` and `GET /api/healthz` return the API health status.

## Render deployment

Create one Render Web Service from the repository root and configure a PostgreSQL database. The Replit database URL is not portable to Render.

- **Build command**

  ```bash
  pnpm install --frozen-lockfile && PORT=4173 BASE_PATH=/ pnpm --filter @workspace/toddlebee run build && pnpm --filter @workspace/api-server run build
  ```

- **Start command**

  ```bash
  pnpm --filter @workspace/api-server run start
  ```

- Set `NODE_ENV=production` and `DATABASE_URL` in the Render service's environment. The server binds to Render's `PORT`, serves the built web app, and exposes the API under `/api`.
- To enable ElevenLabs on Render, add `ELEVENLABS_API_KEY` as a secret and optionally configure the voice ID and model variables in `.env.example`.
- Apply the Drizzle schema to the Render database after setting up its connection string, using the database owner's approved deployment workflow. Never point the development schema push at a production database by mistake.
- AgenticOrg and Pine Labs remain in fallback/unavailable mode until their approved sandbox access and integrations are configured.

The project is prepared for Render but has not been deployed there.

## Reproducible demo

Run the read-only API smoke script after the API workflow starts:

```bash
bash scripts/toddlebee-demo.sh
```

On Replit it uses `REPLIT_DEV_DOMAIN`; elsewhere set `TODDLEBEE_BASE_URL` to the running app URL.

1. Start a learning session and choose English or Tamil.
2. Change the language during the lesson to demonstrate the persistent switch.
3. Complete the five lesson sections and try an alternative explanation.
4. In the quiz, answer one question incorrectly repeatedly to see the hint, visual support, and educator review escalation; then answer correctly and finish.
5. Open Progress and confirm the counts reflect recorded attempts.
6. Open the educator review queue and approve, edit, or reject an item.
7. Show the activity panel's `Local demo` label and the pricing page's `unavailable` status.

No provider runs or payment transactions are fabricated.
