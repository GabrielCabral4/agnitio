<!-- BEGIN:nextjs-agent-rules -->
# Agnitio — Instructions for Agents

## Before Any Task
1. Read `CLAUDE.md` to understand the full architecture
2. Check the current database state with `alembic current`
3. Never manually modify files inside `alembic/versions/`

## Adding Endpoints
1. Add the schema in `app/schemas/session.py`
2. Add the logic in `app/services/` if it involves AI or heavy processing
3. Add the endpoint in `app/routers/sessions.py`
4. Add the corresponding method in `web/src/lib/api.ts`
5. Test via Swagger at `http://localhost:8000/docs`

## Changing Database Models
1. Edit `app/models/session.py`
2. Generate the migration: `alembic revision --autogenerate -m "description"`
3. Review the generated file in `alembic/versions/` before applying
4. Apply: `alembic upgrade head`
5. Confirm the changes in the Supabase dashboard

## Changing AI Prompts
- Prompts are in `app/services/ai.py`
- Each function instructs the model to return JSON with a specific structure
- When changing a prompt, ensure the JSON output format remains
  compatible with the corresponding Pydantic schema
- Test the function in isolation before committing:
```bash
  python -c "from app.services.ai import generate_study_material; print(generate_study_material('test'))"
```

## Adding Frontend Pages
- Follow Next.js App Router conventions
- Every new page must be a Client Component (`"use client"`) if it uses state or effects
- Use only `api.*` from `@/lib/api.ts` for backend calls
- Style with Tailwind following the existing visual pattern (gray scale, soft borders)

## What Not To Do
- Do not commit `.env` or `web/.env.local`
- Do not add business logic directly in routers — use services
- Do not make raw fetch calls in Next.js pages — use `api.ts`
- Do not switch the Gemini model without checking available quota at aistudio.google.com
- Do not create Python files via PyCharm without verifying encoding (see CLAUDE.md)
<!-- END:nextjs-agent-rules -->
