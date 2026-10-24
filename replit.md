# ToddleBee

ToddleBee is a bilingual learning companion prototype with a Grade 4 fractions lesson, checked practice, learner progress, parent guidance, and a demo-only educator review queue.

## Run & operate

- Replit runs the web and API workflows separately.
- `pnpm run typecheck` — typecheck the workspace.
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API clients and validators from the OpenAPI source.
- `pnpm --filter @workspace/db run push` — apply schema changes to the development database only.
- Required runtime environment: `DATABASE_URL`.
- See `README.md` for the Replit workflow, demo steps, provider status, and Render instructions.

## Source of truth

- API contract: `lib/api-spec/openapi.yaml`
- Database schema: `lib/db/src/schema/toddlebee.ts`
- API routes: `artifacts/api-server/src/routes/`
- Bilingual lesson and quiz content: `artifacts/api-server/src/lib/toddlebee-content.ts`
- Web app: `artifacts/toddlebee/src/App.tsx`

## Architecture and demo constraints

- The frontend and API are separate Replit artifacts; the API can also serve the production Vite build from a single Render web service.
- Answer keys stay on the server. The browser submits selected option IDs, not scores.
- Learning sessions are anonymous and use random IDs stored in the browser. Progress requests are scoped to those IDs.
- ElevenLabs uses the existing Replit connection on Replit; external hosting can use server-only environment variables.
- AgenticOrg is represented only by a labelled local simulation. Pine Labs checkout remains unavailable. Neither fallback may be presented as a real provider operation.
- The educator demo gate is not production authentication. Add real access control, consent, and retention controls before using real child data.
